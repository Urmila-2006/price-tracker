import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import nodemailer from "npm:nodemailer";

serve(async (req) => {
  try {
    // Only allow invoked by Cron (usually validated via Authorization header)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date().toISOString();
    
    // Find due products
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*, profiles!inner(email), price_alerts(*)')
      .lte('next_check_at', now)
      .limit(50);

    if (error) throw error;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ message: "No products due for checking" }), { status: 200 });
    }

    let checked = 0;
    
    for (const product of products) {
      // Simulate price check
      let newPrice = product.current_price;
      const isDemo = Deno.env.get("DEMO_PRICE_SIMULATION") === "true";
      if (isDemo) {
        const drop = Math.random() < 0.2 ? (Math.random() * 0.1) : 0;
        newPrice = Math.max(1, newPrice * (1 - drop));
      }
      
      newPrice = Math.round(newPrice * 100) / 100;
      
      const checkTime = new Date();
      const nextCheck = new Date(checkTime.getTime() + (product.check_interval_minutes * 60000));
      
      await supabaseAdmin.from('products').update({
        previous_price: product.current_price,
        current_price: newPrice,
        last_checked_at: checkTime.toISOString(),
        next_check_at: nextCheck.toISOString(),
        updated_at: checkTime.toISOString()
      }).eq('id', product.id);

      await supabaseAdmin.from('price_history').insert({
        product_id: product.id,
        price: newPrice
      });

      if (product.target_price && newPrice <= product.target_price) {
        const alert = product.price_alerts?.[0];
        if (!alert || alert.enabled) {
          // Send email & create notification
          console.log(`[CRON] Target price reached for ${product.name}! Emailing ${product.profiles.email}`);
          
          let emailSentAt = null;
          try {
            const host = Deno.env.get("SMTP_HOST") || "";
            const port = parseInt(Deno.env.get("SMTP_PORT") || "587");
            const username = Deno.env.get("SMTP_USERNAME") || "";
            const password = Deno.env.get("SMTP_PASSWORD") || "";
            const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "";
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
              to: product.profiles.email,
              subject: `Price Drop Alert: ${product.name}`,
              text: `Target price reached! ${product.name} is now ₹${newPrice}. Target was ₹${product.target_price}.`,
            });
            emailSentAt = checkTime.toISOString();
            
            await supabaseAdmin.from('notifications').insert({
              user_id: product.user_id,
              product_id: product.id,
              type: 'PRICE_DROP',
              message: `Target price reached! ${product.name} is now ₹${newPrice}`,
              sent_at: emailSentAt
            });
          } catch (error) {
            console.error("Failed to send email:", error);
          }
          
          if (alert) {
            await supabaseAdmin.from('price_alerts').update({
              last_notified_at: checkTime.toISOString(),
              enabled: false
            }).eq('id', alert.id);
          }
        }
      }
      checked++;
    }

    return new Response(JSON.stringify({ success: true, checked }), { status: 200 });
  } catch (error) {
    console.error("Cron error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
