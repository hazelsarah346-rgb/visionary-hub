# Visionary Hub — App Workflow & Architecture

This document explains what the app does, how the code is structured, and how to work with it day to day.

---

## What the app does

Visionary Hub is a **social productivity and mentorship app** for students and builders. Main capabilities:

| Area | What it does |
|------|----------------|
| **Auth** | Sign in with Google or email/password (Supabase Auth). Session is used for feed, canvas, journal, settings. |
| **Flow** | Instagram-style community feed: posts with “inspired / encouraged / learned” reactions, create post with image/video upload. |
| **Vision Canvas** | Personal “vision board”: big vision, purpose, strengths, obstacle, 12‑month goal. Can be generated or edited; used by AI features. |
| **Opportunities** | Search for opportunities (jobs, programs, etc.) with optional AI-powered suggestions. |
| **AI Tutor** | Chat with an AI tutor; can use your canvas for context. |
| **Mentorship** | Browse mentors, find peers (accountability partners), apply to become a mentor. |
| **Life Roadmap** | AI-generated step-by-step roadmap from your canvas. |
| **Reflect** | Journal entries plus AI insights on your reflections. |
| **Settings** | Profile, account info, sign out. |

Data (posts, mentors, canvases, journal, goals, projects) is stored in **Supabase**. AI features call **Claude (Anthropic)** or fall back to **Groq** / **OpenAI** via server or Vercel serverless.

---

## High-level architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React SPA)                                             │
│  client/src/App.jsx, main.jsx, api.js, lib/supabase.js           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐
│  Supabase     │   │  Express      │   │  Vercel serverless     │
│  (Auth, DB,   │   │  (local dev   │   │  (production AI only)  │
│   Storage,    │   │   only)       │   │  api/ai/*.js          │
│   Realtime)   │   │  server/      │   │                        │
└───────────────┘   └───────────────┘   └───────────────────────┘
```

- **When Supabase is configured:** The client talks to Supabase for auth, feed, mentors, canvases, journal, storage. AI still goes through your backend (Express locally, or Vercel `api/` in production).
- **Local dev without Supabase:** Client falls back to `fetch('/api/...')` and the Express server in `server/` handles feed, uploads, etc.
- **Production (Vercel):** The built React app is served as static files. Only the routes under `api/` exist as serverless functions; all “data” (feed, mentors, etc.) is Supabase. AI routes are in `api/ai/`.

---

## Repo layout

| Path | Purpose |
|------|--------|
| **client/** | React (Vite) frontend. Single main UI in `App.jsx`, entry in `main.jsx`. |
| **client/src/App.jsx** | All main views (Flow, Canvas, Opportunities, Tutor, Mentorship, Roadmap, Reflect, Settings), auth screen, sidebar, modals. Large file; search by tab id or component name. |
| **client/src/api.js** | Data access: feed, posts, mentors, canvases, journal, goals, projects, upload. Uses Supabase when `VITE_SUPABASE_*` is set, else `fetch('/api/...')`. |
| **client/src/lib/supabase.js** | Supabase client init from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. |
| **server/** | Express app for local dev: REST endpoints for feed, upload, mentors, canvases, journal, goals, projects; proxies AI to `server/ai.js`. |
| **server/ai.js** | Local AI: calls Claude/OpenAI/Groq for chat, insights, vision refine, roadmap, tutor, opportunities. Used when you run `npm run dev`. |
| **api/** | Vercel serverless. Only **api/ai/** is used (chat, insights, refine-vision, roadmap, tutor, opportunities). Shared AI helper: **api/_lib/claude.js** (Claude → OpenAI → Groq). |
| **supabase/** | **schema.sql** (tables, RLS), **seed.sql** (sample data), **migrations/** (e.g. mentor columns). Run in Supabase SQL Editor. |
| **vercel.json** | Build command, output dir (`client/dist`), rewrites so `/api/*` and SPA fallback work. |

---

## Coding workflow

### 1. Run locally

```bash
npm run dev
```

- Starts Vite (e.g. port 5173) and Express (e.g. port 3001).
- Frontend uses Supabase if `client/.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- AI uses `server/ai.js` and root `.env` (`ANTHROPIC_API_KEY` or `GROQ_API_KEY`; optional `CLAUDE_MODEL`).

### 2. Env and config

- **client/.env** (or Vercel “Environment Variables” for client):  
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Root .env** (or Vercel for serverless):  
  `GROQ_API_KEY` and/or `ANTHROPIC_API_KEY`; optional `CLAUDE_MODEL` (e.g. `claude-sonnet-4-6`).
- **Supabase:** Run `supabase/schema.sql` and `supabase/seed.sql`; create Storage bucket `media`; set Auth redirect URLs and Google provider for “Continue with Google.”

See **SETUP-GUIDE.md**, **API-KEYS.md**, and **DEPLOY-VERCEL.md** for step-by-step.

### 3. Changing the UI / flows

- **One place for almost everything:** `client/src/App.jsx`. Tabs are driven by `tab` state and the `NAV` list (Flow, Vision Canvas, Opportunities, AI Tutor, Mentorship, Life Roadmap, Reflect). Use search for the tab id (e.g. `'flow'`, `'canvas'`) or component names (`FlowTab`, `AuthPage`, etc.).
- **Data and API:** `client/src/api.js` — add or change methods here; they’re used from `App.jsx`.
- **Styles:** Mostly inline in `App.jsx`; shared tokens in the `C` object at the top. Global/base styles in `client/src/index.css`.

### 4. Changing AI behavior

- **Local:** Edit `server/ai.js` (personas, prompts, model choices).
- **Production (Vercel):** Edit `api/ai/*.js` and `api/_lib/claude.js`. Default Claude model is set in `api/_lib/claude.js` (and optional env `CLAUDE_MODEL`).

### 5. Changing data model

- **Supabase:** Adjust `supabase/schema.sql` (and migrations if you already have data), run in SQL Editor. Update `client/src/api.js` and any RLS so the client still has the right access.
- **Local fallback:** If you still use Express for some endpoints, update `server/index.js` and/or `server/db.js` to match.

### 6. Deploy (Vercel)

- Push to the branch connected to Vercel. Build runs `cd client && npm install && npm run build`; output is `client/dist`. All `/api/*` requests are handled by serverless functions under `api/` (and rewrites in `vercel.json`). Set the same env vars in the Vercel project (Supabase + AI keys).

---

## Main tabs and where they live

| Tab id | Component / area in App.jsx | Data / API |
|--------|-----------------------------|------------|
| `flow` | FlowTab | Feed from Supabase `posts` or `/api/feed`; create post, reactions; upload via Supabase Storage `media` or `/api/upload` |
| `canvas` | Vision canvas UI | Canvas from Supabase or `/api/canvases`; AI refine via `/api/ai/refine-vision` or server |
| `opportunities` | Opportunities tab | Search + optional AI via `/api/ai/opportunities` |
| `tutor` | AI Tutor | Chat via `/api/ai/tutor` or server |
| `mentorship` | Mentorship (mentors, peers, become mentor) | Mentors from Supabase or `/api/mentors`; AI for peer suggestions / mentor apply |
| `roadmap` | Life Roadmap | Canvas + `/api/ai/roadmap` or server |
| `reflect` | Reflect (journal + insights) | Journal from Supabase or `/api/journal`; insights via `/api/ai/insights` |
| Settings | Settings / profile | User from Supabase Auth; sign out |

---

## Auth flow (Google and email)

1. **App load:** `App.jsx` calls `supabase.auth.getSession()` and subscribes to `onAuthStateChange`. If no session and Supabase is configured, it shows `AuthPage`.
2. **Google:** User clicks “Continue with Google” → `handleGoogle` calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })` → redirect to Google → back to app; Supabase sets session from hash.
3. **Redirect URLs:** In Supabase (Authentication → URL Configuration) you must add your app URLs (e.g. `http://localhost:5173`, `https://project-u53n4.vercel.app`). In Google Cloud (OAuth client), the “Authorized redirect URI” must be the **Supabase** callback URL (from Supabase → Providers → Google).

---

## Quick reference: key files

| Want to… | Open / edit |
|----------|-------------|
| Change nav labels or tabs | `client/src/App.jsx` — `NAV` and sidebar |
| Change feed or post shape | `client/src/api.js` (getFeed, addPost) + Supabase `posts` |
| Change mentor or canvas data | `client/src/api.js` + `supabase/schema.sql` |
| Change AI model or prompts (local) | `server/ai.js` |
| Change AI model or prompts (Vercel) | `api/_lib/claude.js`, `api/ai/*.js` |
| Add env var for frontend | `client/.env` (prefix with `VITE_`) and Vercel env |
| Add env var for AI/backend | Root `.env` and Vercel env |
| Fix auth / redirect | Supabase URL Configuration + Google OAuth client; `handleGoogle` and `redirectTo` in `App.jsx` |

---

## Related docs

- **README.md** — Quick start and deploy.
- **SETUP-GUIDE.md** — Supabase schema, seed, storage, Realtime, auth URLs, Google provider.
- **API-KEYS.md** — Groq, Anthropic, optional `CLAUDE_MODEL`.
- **DEPLOY-VERCEL.md** — Deploy and env on Vercel.
