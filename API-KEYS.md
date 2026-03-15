# API Keys — Why Nothing Works Without Them

If **Opportunities search**, **AI Tutor**, **Mentor profile generation**, or **Vision Board AI** return nothing or placeholders, the app has no AI keys set. Fix it in about 5 minutes.

---

## Step 1 — Get a free Groq API key

1. Go to **[console.groq.com](https://console.groq.com)** → Sign up (or log in).
2. Create an API key (e.g. **API Keys** → **Create API Key**).
3. Copy the key (it starts with `gsk_`).

---

## Step 2 — Add it to your root `.env`

1. In the project root (`visionary-hub`), create `.env` if it doesn’t exist:
   ```bash
   cp .env.example .env
   ```
2. Open **`visionary-hub/.env`** (the one in the project root, not `client/.env`).
3. Set the Groq key (replace the placeholder):
   ```
   GROQ_API_KEY=gsk_YOUR_ACTUAL_KEY_HERE
   ```
4. Save the file.

---

## Step 3 — Supabase (database + auth + feed)

1. Go to your **Supabase** project → **Settings** → **API**.
2. Copy **Project URL** and **anon public** key.
3. Open **`client/.env`** and set:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
   (Use your real values; you may already have these.)

---

## Step 4 — Restart the server

After saving any `.env`:

```bash
# Stop the server (Ctrl+C), then:
npm run dev
```

The server only reads `.env` on startup, so a restart is required.

---

## Optional — Mentor table columns

If you already ran `schema.sql` before we added the new mentor columns, run this in **Supabase** → **SQL Editor**:

```sql
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS email text;
```

---

## Summary

| What              | Where          | Key / value                          |
|-------------------|----------------|--------------------------------------|
| AI (Groq)         | **Root** `.env` | `GROQ_API_KEY=gsk_...`               |
| AI (Claude)       | **Root** `.env` | `ANTHROPIC_API_KEY=sk-ant-...`       |
| DB + Auth + Feed  | **client/.env** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

After this, Opportunities, AI Tutor, Mentor generation, and Vision Board AI use real AI; the feed and auth use Supabase.
