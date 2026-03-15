# Visionary Hub — Setup Guide

## Run Locally (2 steps)

```bash
# From the visionary-hub folder:
npm install
cd client && npm install && cd ..
npm run dev
```
App → **http://localhost:5173** · API → **http://localhost:3001**

---

## Connect Supabase

### 1 — Run the schema
Supabase Dashboard → **SQL Editor** → New query → paste `supabase/schema.sql` → Run

### 2 — Run seed (mentors, posts, goals)
SQL Editor → New query → paste `supabase/seed.sql` → Run

### 3 — Create media bucket
**Storage** → New bucket → name: **`media`** → Public: **Yes** → Create  
Then: bucket **media** → Policies → add policy so anon/auth can upload and read

### 4 — Enable Realtime on posts
**Database** → **Replication** → turn **Realtime** ON for table **`posts`**  
(Or in SQL: `alter publication supabase_realtime add table posts;`)

### 5 — Confirm your env vars
`client/.env` should have:
```
VITE_SUPABASE_URL=https://hazhdsxngovturtysfby.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
Find your anon key: **Project Settings → API → anon / public**

---

## Add OpenAI (for real AI responses)
Create `.env` in root `visionary-hub/` folder:
```
OPENAI_API_KEY=sk-your-key-here
```
Without it, smart demo responses are used automatically.

---

## Deploy to Vercel
```bash
git add . && git commit -m "Ready" && git push
```
Then: vercel.com/new → Import repo → add env vars → Deploy

---

## Where is everything?

| Feature | How to access |
|---|---|
| 📸 Photo / Video Upload | Tap **+** in center nav → select file → caption → Share |
| 🎬 Video posts | Same as above — MP4/WebM supported up to 50MB |
| 📖 Stories | Top of Home feed — your circle starts the camera flow |
| 🗺 AI Roadmap | Canvas tab → **Roadmap** |
| ✨ AI Vision Refiner | Canvas tab → **Vision AI** |
| 💬 Mentor Chat | Mentors tab → tap any mentor |
| 📓 Journal + AI Insights | Reflect tab |
| 🌿 Safe Mode | Top-right button → full-screen calm overlay |
| 🎯 Goals & Projects | Home → Goals / Projects tabs |
