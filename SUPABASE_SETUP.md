# Supabase Setup for UniApp Todo List

To get your Todo List working, follow these steps:

## 1. Create Supabase Project
1. Go to [database.new](https://database.new) and create a new project.
2. Once created, go to **Project Settings** -> **API**.
3. Copy your `Project URL` and `anon` public key.

## 2. Configure Environment Variables
1. Copy `.env.example` to `.env` in the root of your project.
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste your URL and Key:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxh...
   ```

## 3. Create Database Table
1. Go to the **SQL Editor** in your Supabase dashboard.
2. Copy the content of `src/api/schema.sql`.
3. Paste it into the SQL Editor and click **Run**.
   - This creates the `todos` table.
   - It sets up Row Level Security (RLS) so users can only see their own data.

## 4. Run the App
- Run `pnpm dev:h5` to start the web version.
- Or use HBuilderX to run on a phone/simulator.

## Troubleshooting
- **Network Request Failed**: If running on a phone or WeChat Mini Program, you must add your Supabase URL to the whitelist in the dashboard (MP-Weixin Admin -> Development Settings -> Server Domains).
- **Types Error**: Run `pnpm install` if you see missing type errors.
