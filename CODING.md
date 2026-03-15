# Coding Guide — What a Developer Needs to Know

This file is for developers working in the Visionary Hub codebase. It covers stack, entry points, state/data flow, and where to change or add code.

---

## Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 19, Vite 8, Tailwind 4, lucide-react (icons). ES modules. |
| **State** | React `useState` / `useEffect` only — no Redux or global store. Root `App.jsx` holds `tab`, `session`, `feed`, `canvas`, etc. and passes props down. |
| **Data** | Supabase (auth, Postgres, Storage, Realtime). Client talks to Supabase via `@supabase/supabase-js` when `VITE_SUPABASE_*` is set. |
| **Backend (local)** | Node, Express 5. Serves `/api/*` and proxies AI to `server/ai.js`. Uses `dotenv`, `cors`, `multer` (upload). |
| **Backend (prod)** | Vercel serverless. Only `api/ai/*.js` exist; no Express. All non-AI data is Supabase from the client. |
| **AI** | Anthropic (Claude), with fallback to OpenAI or Groq. Local: `server/ai.js`. Prod: `api/_lib/claude.js` + `api/ai/*.js`. |

---

## Entry points and scripts

- **Root:** `npm run dev` → runs `concurrently` for `dev:server` (nodemon `server/index.js`) and `dev:client` (Vite in `client/`). Ports: Vite usually 5173, Express usually 3001 (or as in `server/index.js`).
- **Client entry:** `client/index.html` loads `client/src/main.jsx` → `main.jsx` mounts `<App />` (with optional ErrorBoundary). No router — one `App.jsx`, tab state switches views.
- **Server entry (local):** `server/index.js` — Express app, mounts routes, serves `client/dist` in prod or proxies to Vite in dev if configured.
- **Vercel:** Build runs `cd client && npm install && npm run build`; output is `client/dist`. Requests to `/api/*` are rewritten to serverless functions under `api/` (see `vercel.json`).

---

## Where the UI and logic live

- **Single main component:** `client/src/App.jsx`. It contains:
  - Auth: session check, `AuthPage` (Google + email/password), redirect after login.
  - Main app: sidebar (`NAV` drives tab ids), and one big switch that renders the active tab (FlowTab, canvas UI, opportunities, tutor, mentorship, roadmap, reflect, settings).
  - Shared state: `tab`, `session`/`user`, `feed`, `canvas`, `mentors`, loading/error state. Passed as props to child sections.
- **No React Router.** Current “page” is `tab` (string): `'flow' | 'canvas' | 'opportunities' | 'tutor' | 'mentorship' | 'roadmap' | 'reflect'`, plus `'settings'` for the settings panel. Search for `setTab(` or `tab === '...'` to find where tabs are set and rendered.
- **NAV array** (in `App.jsx`) defines sidebar items: `id`, `icon`, `label`, `sub`. Adding a new tab = add an id to `NAV` and add a branch in the main switch that renders when `tab === thatId`.

---

## Data layer (client)

- **`client/src/api.js`** — Single place for all server/Supabase data access. Exports `api` with methods like:
  - `getFeed`, `addPost`, `reactToPost`
  - `getMentors`
  - `getCanvases`, `getCurrentCanvas`, `saveCanvas`
  - `getJournal`, `addJournalEntry`
  - `getGoals`, `getProjects`, etc.
  - `uploadFile` (Supabase Storage bucket `media`, or POST to `/api/upload` as fallback)
- **Supabase vs Express:** Each method checks `useSupabase()` (Supabase client exists). If true, it uses `supabase.from(...)` or Storage; if false, it uses `fetchAPI('/...')` which hits the Express server. So: one API surface, two backends depending on env.
- **`client/src/lib/supabase.js`** — Creates the Supabase client from `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Exports `supabase`. If env is missing, export can be `null` and `api.js` falls back to Express.

---

## How to add or change a feature

1. **New tab/screen**
   - Add `{ id: 'myTab', icon: SomeIcon, label: 'My Tab', sub: '...' }` to `NAV` in `App.jsx`.
   - In the main content switch, add `tab === 'myTab' && <MyTabComponent ... />`.
   - Pass needed props (e.g. `user`, `canvas`, `setTab`) from the parent state.

2. **New data (new table or endpoint)**
   - **Supabase:** Add table/RLS in `supabase/schema.sql` (or a migration), run in Supabase SQL Editor.
   - **Client:** Add a method in `api.js`, e.g. `getMyData`, using `supabase.from('my_table').select(...)` or `fetchAPI('/my-data')`.
   - **Local Express (if you still need it):** In `server/index.js` add a route (e.g. `app.get('/api/my-data', ...)`) and implement it (optionally using `server/db.js` if you have one).

3. **New AI endpoint**
   - **Local:** In `server/ai.js` add a function that calls `callClaude`/`callClaudeChat` (or OpenAI/Groq). In `server/index.js` add e.g. `app.post('/api/ai/my-feature', ...)` that calls it and returns JSON.
   - **Vercel:** Add `api/ai/my-feature.js` that exports a default `handler(req, res)`. Use `api/_lib/claude.js` (`askAI` / `chatAI`). Add a rewrite in `vercel.json` if you want a custom path (optional; path usually matches file path).
   - **Client:** In `App.jsx` (or the component that needs it), `fetch('/api/ai/my-feature', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ... }) })` and handle the response.

4. **Changing styles**
   - Shared tokens (colors, etc.) are in the `C` object at the top of `App.jsx`. Inline styles are used throughout. Global/base styles (e.g. `#root`, `body`) are in `client/src/index.css`. Tailwind is available; many components use inline style objects for consistency.

5. **Auth**
   - Session: `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()` in `App.jsx`. Session is stored in state and passed as `user` to the main app and sidebar.
   - Google: `handleGoogle` in `AuthPage` calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`. Redirect URLs must be allowlisted in Supabase (Authentication → URL Configuration). Google OAuth client must have Supabase’s callback URL as authorized redirect URI.

---

## Important patterns

- **No global state library.** Top-level state in `App.jsx` is passed down. For a new piece of state, add `useState` where it’s needed (often in the root or in the tab component that owns the flow) and pass setters if children need to update it.
- **AI calls:** Frontend always POSTs to `/api/ai/...` with JSON body. Backend (Express or Vercel) reads body, calls Claude/Groq/OpenAI, returns `{ reply: string }` or similar. Timeouts and error handling are in the client (e.g. `Promise.race` with a timeout).
- **Upload:** Client uses `api.uploadFile(file)`. If Supabase is configured, it uploads to the `media` bucket and returns the public URL. Otherwise it POSTs to `/api/upload` (Express, multer) and uses the returned URL.
- **Map naming:** `App.jsx` imports `Map` from lucide-react (icon). To use the built-in `Map` constructor, use `globalThis.Map` to avoid shadowing.

---

## Backend API surface (Express, local)

Relevant routes (from `server/index.js`): `/api/feed` (GET/POST), `/api/feed/:id/react` (POST), `/api/mentors`, `/api/upload`, `/api/canvases`, `/api/journal`, `/api/ai/chat`, `/api/ai/insights`, `/api/ai/refine-vision`, `/api/ai/roadmap`, `/api/ai/tutor`, `/api/ai/opportunities`, plus goals, projects, settings. Request/response shapes match what `client/src/api.js` and `App.jsx` expect (JSON in, JSON out).

---

## Vercel serverless (production)

- Only the `api/` directory is deployed as functions. Each file under `api/` that exports a default `handler(req, res)` becomes an endpoint. Example: `api/ai/tutor.js` → `/api/ai/tutor`.
- `api/_lib/claude.js` is the shared AI helper (not a route). It exports `askAI`, `chatAI`; uses `ANTHROPIC_API_KEY` or fallback to OpenAI/Groq. Optional env: `CLAUDE_MODEL` (e.g. `claude-sonnet-4-6`).
- No Express in production. Feed, mentors, canvases, journal, auth, upload (to Supabase) are all from the client to Supabase. Only AI goes through Vercel.

---

## Debugging tips

- **Blank page:** Check the browser console. If Supabase isn’t configured, session may hang — there’s a 4s timeout in `App.jsx` for `getSession()`. Check for JS errors (e.g. wrong `Map` usage; use `globalThis.Map` for the constructor).
- **AI not responding:** Ensure root `.env` has `ANTHROPIC_API_KEY` or `GROQ_API_KEY`. On Vercel, set the same in project env. Check Network tab for `/api/ai/*` status and response body.
- **Auth redirect not working:** Supabase Redirect URLs must include your app origin (e.g. `https://project-u53n4.vercel.app`). Google OAuth client must have exactly the Supabase callback URL in Authorized redirect URIs (from Supabase → Providers → Google).
- **Data missing:** Confirm Supabase schema and seed were run; check RLS. For local fallback, ensure Express is running and the route exists.

---

## File quick reference (coder)

| Task | File(s) |
|------|--------|
| Add/rename tab, change nav | `client/src/App.jsx` — `NAV`, and the switch that renders by `tab` |
| Add/change data call (feed, mentors, canvas, journal, upload) | `client/src/api.js` |
| Change Supabase schema or RLS | `supabase/schema.sql`, run in SQL Editor |
| Add/change local API route | `server/index.js`, optionally `server/db.js` |
| Add/change local AI behavior | `server/ai.js` |
| Add/change production AI endpoint | `api/ai/<name>.js`, `api/_lib/claude.js` |
| Auth / Google redirect | `App.jsx` (`handleGoogle`, `redirectTo`), Supabase URL config, Google Cloud OAuth client |
| Env vars | `client/.env` (VITE_*), root `.env` (API keys), Vercel project env |
| Build/deploy config | `vercel.json`, `package.json`, `client/package.json` |

For product-level explanation and architecture diagrams, see **WORKFLOW-AND-ARCHITECTURE.md** and **EXPLANATION.md**.
