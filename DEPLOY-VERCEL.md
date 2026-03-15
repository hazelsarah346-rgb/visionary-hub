# Deploy Visionary Hub to Vercel

Follow these steps to push your code and deploy on Vercel.

---

## 1. Git push (from your machine)

```bash
cd /Users/sarah/visionary-hub

# Commit everything you want to deploy
git add .
git status
git commit -m "Deploy: Visionary Hub"
git push origin main
```

(Use your real branch name if it’s not `main`, e.g. `git push origin master`.)

---

## 2. Connect the repo on Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in.
2. **Add New** → **Project**.
3. **Import** your Git repository (e.g. GitHub/GitLab).
4. Select the **visionary-hub** repo.
5. **Framework Preset:** leave as **Other** (we use a custom build).
6. **Root Directory:** leave as `.` (repo root).
7. **Build Command:** already set in `vercel.json`: `cd client && npm install && npm run build`.
8. **Output Directory:** `client/dist` (from `vercel.json`).
9. Do **not** start the deploy yet — add env vars first.

---

## 3. Add environment variables on Vercel

In the project settings (or during import), open **Environment Variables** and add:

### For the frontend (build-time; needed so the client can talk to Supabase)

| Name                     | Value                    | Environment   |
|--------------------------|--------------------------|---------------|
| `VITE_SUPABASE_URL`      | `https://xxxx.supabase.co` | Production (and Preview if you want) |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (your anon key) | Production (and Preview if you want) |

### For the API (serverless AI routes)

| Name                 | Value              | Environment   |
|----------------------|--------------------|---------------|
| `GROQ_API_KEY`       | `gsk_...`          | Production (and Preview if you want) |
| `ANTHROPIC_API_KEY`  | `sk-ant-...` (optional) | Production (and Preview if you want) |

Use the same values you have in local **root `.env`** (for AI) and **`client/.env`** (for Supabase).  
Then trigger **Deploy** (or re-deploy after saving env vars).

---

## 4. Supabase redirect URL for production

1. Open **Supabase** → **Authentication** → **URL Configuration**.
2. Under **Redirect URLs**, add your Vercel URL, e.g.:
   - `https://your-project.vercel.app`
   - or your custom domain if you set one.
3. Save.

Without this, Google OAuth (and similar) will not redirect back to the live app.

---

## 5. After deploy

- Your app will be at `https://your-project.vercel.app` (or the URL Vercel shows).
- Feed, auth, and storage use **Supabase** (no Express server on Vercel).
- AI features (Tutor, Opportunities, Vision, etc.) run via **Vercel serverless** and need **GROQ_API_KEY** (and optionally **ANTHROPIC_API_KEY**) set in Vercel.

---

## Quick checklist

- [ ] Code pushed: `git push origin main` (or your branch).
- [ ] Vercel project created and repo connected.
- [ ] **VITE_SUPABASE_URL** and **VITE_SUPABASE_ANON_KEY** set in Vercel.
- [ ] **GROQ_API_KEY** (and optionally **ANTHROPIC_API_KEY**) set in Vercel.
- [ ] Production URL added to Supabase **Redirect URLs**.
- [ ] Deploy triggered and build succeeded.
