# Visionary Hub

AI-powered social productivity and visionary reflection. Built with React, Supabase, and Vercel.

## Quick Start

### 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. In **SQL Editor**, run `supabase/schema.sql`
3. In **Storage**, create a public bucket named **`media`**
4. In **Settings > API**, copy your Project URL and `anon` key

### 2. Environment variables

Create `client/.env`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Optional (for full AI): add `OPENAI_API_KEY` to root `.env`

### 3. Local dev

```bash
npm run dev
```

- **With Supabase**: Data uses Supabase; AI uses local Express (port 3001)
- **Without Supabase**: Falls back to local JSON + Express

### 4. Deploy to Vercel

1. Connect your repo to Vercel
2. Add env vars in Project Settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` (optional)
3. Deploy

Vercel serves the frontend and runs AI routes as serverless functions.
