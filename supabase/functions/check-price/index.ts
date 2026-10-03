import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function scrapePrice(url: string) {
  // Simple fallback simulation if SerpApi isn't used for exact URLs
  // In a real app we would use a scraping service or SerpApi product URL search
  // Here we just return a simulated price based on demo simulation rules
  return Math.floor(Math.random() * 50000) + 1000;
}

async function sendTargetEmail(email: string, product: any, newPrice: number, supabaseClient: any) {
  const host = Deno.env.get("SMTP_HOST") || "";
  const port = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const username = Deno.env.get("SMTP_USERNAME") || "";
  const password = Deno.env.get("SMTP_PASSWORD") || "";
  const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "";

  let emailSentAt = null;

  try {
    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465,
      auth: {
        user: username,
        pass: password,
      },
    });

    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: `Price Drop Alert: ${product.name}`,
      text: `Target price reached! ${product.name} is now ₹${newPrice}. Target was ₹${product.target_price}.`,
    });
    emailSentAt = new Date().toISOString();
    
    // Create notification in DB
    await supabaseClient.from('notifications').insert({
      user_id: product.user_id,
      product_id: product.id,
      type: 'PRICE_DROP',
      message: `Target price reached! ${product.name} is now ₹${newPrice}`,
      sent_at: emailSentAt
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    const { product_id, url, preview_only } = await req.json();

    if (preview_only && url) {
      // Just preview a new URL
      const price = await scrapePrice(url);
      return new Response(JSON.stringify({
        name: url.split('/').pop() || 'Unknown Product',
        price: price,
        currency: 'INR',
        image_url: null,
        availability: true,
        source: 'custom'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!product_id) {
      return new Response(JSON.stringify({ error: "Missing product_id" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Load product (ensure it belongs to user)
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('*, price_alerts(*)')
      .eq('id', product_id)
      .eq('user_id', user.id)
      .single();

    if (productError || !product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
    }

    // Simulate scraping new price
    let newPrice = product.current_price;
    const isDemo = Deno.env.get("DEMO_PRICE_SIMULATION") === "true";
    if (isDemo) {
      const drop = Math.random() < 0.3 ? (Math.random() * 0.15) : (Math.random() * 0.05);
      newPrice = Math.max(1, newPrice * (1 - drop));
    } else {
      newPrice = await scrapePrice(product.url);
    }

    newPrice = Math.round(newPrice * 100) / 100;

    // Update product
    const now = new Date();
    const nextCheck = new Date(now.getTime() + (product.check_interval_minutes * 60000));
    
    await supabaseClient.from('products').update({
      previous_price: product.current_price,
      current_price: newPrice,
      last_checked_at: now.toISOString(),
      next_check_at: nextCheck.toISOString(),
      updated_at: now.toISOString()
    }).eq('id', product.id);

    // Insert history
    await supabaseClient.from('price_history').insert({
      product_id: product.id,
      price: newPrice
    });

    // Check alerts
    if (product.target_price && newPrice <= product.target_price) {
      const alert = product.price_alerts?.[0];
      if (alert && alert.enabled) {
        // Only send if we haven't already notified for this target
        // Or implement logic to avoid spam
        await sendTargetEmail(user.email!, product, newPrice, supabaseClient);
        
        await supabaseClient.from('price_alerts').update({
          last_notified_at: now.toISOString(),
          enabled: false
        }).eq('id', alert.id);
      } else if (!product.price_alerts || product.price_alerts.length === 0) {
        await sendTargetEmail(user.email!, product, newPrice, supabaseClient);
      }
    }

    return new Response(JSON.stringify({ success: true, new_price: newPrice }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Check price error:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
