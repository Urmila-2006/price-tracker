import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const backendUrl = Deno.env.get("BACKEND_URL") || "https://your-production-url.vercel.app";
    const cronSecret = Deno.env.get("CRON_SECRET") || "";

    const response = await fetch(`${backendUrl}/api/cron/check-prices`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${cronSecret}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Backend failed with status ${response.status}: ${text}`);
      return new Response(JSON.stringify({ error: "Backend check failed", details: text }), { 
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify({ success: true, data }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Cron execution error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
