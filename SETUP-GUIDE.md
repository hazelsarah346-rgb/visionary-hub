# Visionary Hub - Setup Guide

To see **real data** (posts, mentors, uploads, real-time feed), complete these steps in Supabase.

---

## Step 1: Run the schema

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **SQL Editor** → **New query**
3. Copy and paste the entire contents of **`supabase/schema.sql`**
4. Click **Run** (or Cmd+Enter)

---

## Step 2: Run the seed

1. In **SQL Editor** → **New query**
2. Copy and paste the entire contents of **`supabase/seed.sql`**
3. Click **Run**

This adds sample mentors, posts, goals, projects, and journal so the feed and mentors tabs have data.

---

## Step 3: Create the Storage bucket

1. In Supabase, click **Storage** (left sidebar)
2. **New bucket**
3. Name: **`media`**
4. Toggle **Public bucket** ON
5. **Create bucket**
6. Open the `media` bucket → **Policies** → add policies if needed so authenticated/anonymous users can upload and read (or use “Allow all” for the bucket for simplicity).

---

## Step 4: Enable Realtime on `posts`

1. In Supabase, go to **Database** → **Replication**
2. Find **`posts`** in the list and turn **Realtime** ON for it

Or run in SQL Editor:

```sql
alter publication supabase_realtime add table posts;
```

Then the feed can update in real time when new posts are added.

---

## Step 5: API keys (why Opportunities, AI Tutor, Mentor generation, Vision Board work)

Without API keys, the app runs in demo mode and those features return nothing or placeholders.

### 5a — Groq (recommended: free and fast)

1. Go to **[console.groq.com](https://console.groq.com)** → Sign up → **Create API Key**
2. Copy the key (starts with `gsk_`)
3. In the **project root** create **`.env`** (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
4. Open **`/Users/sarah/visionary-hub/.env`** (or `visionary-hub/.env`) and set:
   ```
   GROQ_API_KEY=gsk_YOUR_ACTUAL_KEY_HERE
   ```
5. Save the file.

Optional: add **ANTHROPIC_API_KEY** (Claude) for higher quality; the server uses Claude first, then Groq, then demo.

### 5b — Supabase (database + auth + feed)

1. In Supabase: **Settings** (gear) → **API**
2. Copy **Project URL** and **anon public** key
3. Open **`client/.env`** (not the root `.env`) and set:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

(You can keep existing values if they’re already correct.)

---

## Step 6: Auth redirect URLs (Google OAuth)

1. **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   - `http://localhost:5173`
   - `http://localhost:5175` (if you use that port)
   - Your production URL (e.g. `https://your-app.vercel.app`)
3. Save. Without these, Google OAuth won’t redirect back after login.

---

## Step 7: Mentor columns (if you already ran schema before)

If your `mentors` table was created before we added `status`, `verified`, and `email`, run this in **SQL Editor**:

```sql
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS email text;
```

(Or run **`supabase/migrations/001_mentor_columns.sql`**.)

---

## Step 8: Run the app

From the project root:

```bash
npm run dev
```

**Restart the server after changing `.env`** so it picks up the new keys.

Open **http://localhost:5173** (or the port shown in the terminal).

With Supabase keys set, the app shows the login screen first. After Google OAuth or email signup, you land in the Flow feed. The sidebar shows your avatar, name, and **Sign Out**.

---

## Checklist

- [ ] **schema.sql** run in Supabase SQL Editor  
- [ ] **seed.sql** run in Supabase SQL Editor  
- [ ] **Mentor columns** run (migration or SQL above) if mentors table already existed  
- [ ] **Storage** bucket **`media`** created, **Public** ON  
- [ ] **Realtime** enabled for **`posts`** (Database → Replication)  
- [ ] **Root `.env`** has `GROQ_API_KEY=gsk_...` (or `ANTHROPIC_API_KEY`) so AI features work  
- [ ] **client/.env** has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`  
- [ ] **Redirect URLs** added (Authentication → URL Configuration) for localhost and production  
- [ ] **`npm run dev`** running (restart after editing .env) and app opened at http://localhost:5173  

Once this is done, posts, mentors, uploads, real-time feed, Opportunities, AI Tutor, Mentor generation, and Vision Board AI all work with real data and AI.
