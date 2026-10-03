-- 002_price_check_cron.sql

create extension if not exists pg_net;

-- Invoke the edge function every 5 minutes:
SELECT cron.schedule(
  'price-check-job',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co/functions/v1/check-due-products',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select secret from vault.decrypted_secrets where name = 'cron_secret' limit 1)
    )
  ) as request_id;
  $$
);
