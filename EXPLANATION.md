# What Visionary Hub Is and How It Works

## In plain language

**Visionary Hub** is a web app where students and builders can set a personal vision, get mentorship-style guidance, keep a journal, and use a shared feed. It combines your own goals (stored in a “Vision Canvas”) with AI-powered tools and optional human mentors.

---

## What it does

- **Sign in** with Google or email. Everything is tied to your account.
- **Flow** — A feed like Instagram: people post updates; you can react with “inspired,” “encouraged,” or “learned.” You can create posts with text and images/videos.
- **Vision Canvas** — Your one-page vision: big vision, purpose, strengths, main obstacle, and a 12‑month goal. You can edit it or generate it with AI. Other features (tutor, roadmap, insights) use this.
- **Opportunities** — Search for opportunities; AI can suggest relevant ones based on your canvas.
- **AI Tutor** — A chat that acts as a tutor; it can use your Vision Canvas to give more relevant advice.
- **Mentorship** — Browse mentors, find peers (e.g. accountability partners), or apply to become a mentor.
- **Life Roadmap** — AI turns your Vision Canvas into a step-by-step roadmap.
- **Reflect** — Journal entries; AI can give short insights on what you wrote.
- **Settings** — Your profile and sign out.

---

## How the tech fits together

- **Frontend:** One React app (Vite) in `client/`. Almost all UI lives in `App.jsx`: tabs, auth screen, sidebar, modals.
- **Data:** Supabase holds users (auth), posts, mentors, canvases, journal, goals, projects. File uploads go to Supabase Storage (bucket `media`).
- **AI:** When you use the tutor, roadmap, insights, or opportunity suggestions, the app calls your backend. The backend then calls Claude (Anthropic) or, if not set up, Groq or OpenAI.
- **Local dev:** You run the React app and an Express server (`npm run dev`). The Express server serves the API and runs the AI logic. The React app talks to Supabase for data and to Express for AI.
- **Production (Vercel):** The React app is built to static files and served by Vercel. Data still comes from Supabase. AI runs in Vercel serverless functions under `api/ai/` (e.g. tutor, roadmap, insights).

So: **browser → Supabase for data and auth, and → your backend (Express or Vercel) for AI.**

---

## Summary

Visionary Hub is a **social productivity and mentorship app** that stores your vision and activity in **Supabase** and uses **Claude (or other AI)** for tutor, roadmap, insights, and opportunities. The codebase is one main React UI (`App.jsx`), one data layer (`api.js` + Supabase), and AI in the server (Express locally, Vercel serverless in production).

For file-by-file workflow and where to change things, see **WORKFLOW-AND-ARCHITECTURE.md**.
