import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { q } = await req.json();
    
    if (!q) {
      return new Response(JSON.stringify({ error: "Missing query" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    const serpApiKey = Deno.env.get("SERPAPI_KEY");
    if (!serpApiKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    const params = new URLSearchParams({
      engine: 'google_shopping',
      q: q,
      api_key: serpApiKey,
      gl: 'in',
      hl: 'en'
    });

    const response = await fetch(`https://serpapi.com/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`SerpApi responded with ${response.status}`);
    }

    const data = await response.json();
    const products = data.shopping_results || [];

    return new Response(JSON.stringify(products), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Search error:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
