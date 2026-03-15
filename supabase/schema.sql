-- Visionary Hub - Supabase schema
-- Run this in Supabase SQL Editor
-- For existing projects run the migration lines at the bottom.

-- ─────────────────────────────────────────────────
-- STORAGE SETUP (run once in SQL Editor):
-- 1. Go to Storage → New Bucket → name: "media" → Public: ON → Save
-- 2. Then run this policy so anyone can upload:
-- insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict do nothing;
-- create policy "Public media upload" on storage.objects for insert with check (bucket_id = 'media');
-- create policy "Public media read"   on storage.objects for select using (bucket_id = 'media');
-- ─────────────────────────────────────────────────

-- Posts (feed)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id text default 'u1',
  author_name text default 'Anonymous',
  author_img text,
  content text not null,
  image_url text,
  media_type text default 'image',
  inspired int default 0,
  encouraged int default 0,
  learned int default 0,
  created_at timestamptz default now()
);

-- Mentors (static-ish, seed data)
create table if not exists mentors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  quote text,
  img text,
  stats text,
  persona text,
  field text,
  status text default 'approved',
  verified boolean default false,
  email text
);

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text default 'in_progress',
  progress int default 0,
  due_date date,
  created_at timestamptz default now()
);

-- Goals
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  done boolean default false,
  created_at timestamptz default now()
);

-- Journal
create table if not exists journal (
  id uuid primary key default gen_random_uuid(),
  content text,
  created_at timestamptz default now()
);

-- Settings (key-value)
create table if not exists settings (
  key text primary key,
  value jsonb
);

-- Canvases
create table if not exists canvases (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- Current canvas (single row)
create table if not exists current_canvas (
  id int primary key default 1 check (id = 1),
  canvas_id uuid,
  title text default 'Your vision'
);

-- Enable RLS (optional - disable for demo, enable when adding auth)
alter table posts enable row level security;
alter table mentors enable row level security;
alter table projects enable row level security;
alter table goals enable row level security;
alter table journal enable row level security;
alter table settings enable row level security;
alter table canvases enable row level security;
alter table current_canvas enable row level security;

-- Allow all for anon (demo mode - tighten when adding auth)
create policy "Allow all posts" on posts for all using (true) with check (true);
create policy "Allow all mentors" on mentors for all using (true) with check (true);
create policy "Allow all projects" on projects for all using (true) with check (true);
create policy "Allow all goals" on goals for all using (true) with check (true);
create policy "Allow all journal" on journal for all using (true) with check (true);
create policy "Allow all settings" on settings for all using (true) with check (true);
create policy "Allow all canvases" on canvases for all using (true) with check (true);
create policy "Allow all current_canvas" on current_canvas for all using (true) with check (true);

-- Minimal defaults (empty - add your own canvases)
insert into current_canvas (id, title) values (1, 'Your vision') on conflict (id) do nothing;
insert into settings (key, value) values ('safe_mode', 'false'::jsonb) on conflict (key) do update set value = excluded.value;

-- Realtime: enable for live feed updates (run after tables exist)
-- alter publication supabase_realtime add table posts;
