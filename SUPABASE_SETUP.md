# Supabase Setup Guide

This project has been migrated from a local PostgreSQL + Redis + Celery architecture to a managed **Supabase** backend. 
We use Supabase Postgres for data storage, and Supabase Cron + Edge Functions for scheduled price checks.

## 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Under your Project Settings -> API, obtain your **Project URL** (`SUPABASE_URL`) and **service_role secret key** (`SUPABASE_SECRET_KEY`).
   *Note: We use the service_role secret key in the FastAPI backend to securely bypass RLS and act as the admin since all DB access is securely handled in FastAPI.*

## 2. Run Database Migrations
Go to your Supabase Dashboard -> SQL Editor and run the migration scripts provided in the `supabase/migrations/` folder:
1. `001_initial_schema.sql` (Creates all tables and indexes for users, products, price history, notifications, and reset tokens).
2. `002_price_check_cron.sql` (Sets up `pg_net` and the cron schedule).

## 3. Enable Required Extensions
Ensure that the `pg_net` extension is enabled. You can do this in the Supabase Dashboard -> Database -> Extensions. Search for `pg_net` and enable it. This is required for `pg_cron` to make HTTP requests to the Edge Function.

## 4. Deploy the Edge Function
We have created an Edge Function located at `supabase/functions/check-prices/index.ts`. This function securely triggers the backend `/api/cron/check-prices` endpoint.

To deploy it:
1. Install the Supabase CLI (`npm install -g supabase`).
2. Login to the CLI (`supabase login`).
3. Link your project (`supabase link --project-ref YOUR_PROJECT_REF`).
4. Deploy the function (`supabase functions deploy check-prices --no-verify-jwt`).
5. Set the secrets for the Edge Function:
   ```bash
   supabase secrets set CRON_SECRET=your_secure_random_string
   supabase secrets set BACKEND_URL=https://your-production-url.vercel.app
   ```

## 5. Configure Environment Variables
Update your `.env` or `.env.local` (and Vercel environment variables) using the updated `.env.example`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_secret_key
SERPAPI_KEY=your_serpapi_key

JWT_SECRET=super_secret_key_change_in_production
...
```
*(Remove old `DATABASE_URL` and `REDIS_URL`)*

## 6. Configure Vercel
Your Vercel configuration (`vercel.json`) remains the same. 
When deploying:
- Ensure you set all the environment variables from Step 5 in the Vercel project settings.
- The `CRON_SECRET` you set in Vercel must match the `CRON_SECRET` you set in the Supabase Edge Function secrets.

## 7. Testing Checklist
1. **Test login**: Create a new user, log out, log back in.
2. **Test product tracking**: Add a new product manually or via Google Shopping search.
3. **Test manual check**: Click "Check Price Now" on a product.
4. **Test scheduled price checking**: Check the Supabase Edge Function logs to see if it's successfully triggering the cron endpoint.
5. **Test email alerts**: Manually update a target price above the current price to trigger a notification and check your inbox.
