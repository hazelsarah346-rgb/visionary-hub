-- ============================================================
-- Visionary Hub — Supabase Seed Data
-- Run this AFTER schema.sql in your Supabase SQL Editor
-- ============================================================

-- ── MENTORS ──────────────────────────────────────────────────
insert into mentors (name, title, quote, img, persona, field) values
  ('Dr. Sarah Okonkwo', 'Productivity Coach',   'Consistency builds the bridge between your goals and reality.',    'https://i.pravatar.cc/150?img=16', 'productivity', 'Academic / Study'),
  ('Marcus Lin',         'Founder Mentor',       'Every empire starts with one bold decision.',                     'https://i.pravatar.cc/150?img=12', 'founder',       'Innovation / Startup'),
  ('Tanya Brooks',       'Peer Mentor',          'Your peers are your greatest resource — invest in each other.',   'https://i.pravatar.cc/150?img=19', 'peer',          'Wellness / Balance'),
  ('David Nguyen',       'Career Strategist',    'Build skills like a portfolio — with intention and consistency.', 'https://i.pravatar.cc/150?img=11', 'career',         'Career / Purpose'),
  ('Amara Osei',         'Wellness Coach',       'You cannot pour from an empty cup. Rest is part of the plan.',   'https://i.pravatar.cc/150?img=20', 'productivity',   'Wellness / Balance'),
  ('James Rivera',       'Tech Industry Mentor', 'Ship fast, learn faster. The best code is code that ships.',     'https://i.pravatar.cc/150?img=14', 'founder',        'Innovation / Startup')
on conflict do nothing;

-- ── CANVASES ─────────────────────────────────────────────────
insert into canvases (name) values
  ('Study Canvas'),
  ('Business Canvas'),
  ('Innovation Canvas'),
  ('Personal Growth Canvas'),
  ('Leadership Canvas')
on conflict do nothing;

-- ── CURRENT CANVAS ───────────────────────────────────────────
insert into current_canvas (id, title) values (1, 'Build a platform that helps 10,000 students find their purpose')
on conflict (id) do update set title = excluded.title;

-- ── SETTINGS ─────────────────────────────────────────────────
insert into settings (key, value) values ('safe_mode', 'false'::jsonb)
on conflict (key) do update set value = excluded.value;

-- ── STARTER GOALS ────────────────────────────────────────────
insert into goals (title, done) values
  ('Land a summer internship or research role', false),
  ('Apply to 3 scholarships this semester',     false),
  ('Connect with 1 new mentor this month',      false),
  ('Complete my Visionary Canvas',              true)
on conflict do nothing;

-- ── STARTER PROJECTS ─────────────────────────────────────────
insert into projects (name, status, progress) values
  ('Launch Pitch Deck',   'in_progress', 60),
  ('Build Portfolio Site','in_progress', 35),
  ('Scholarship Applications', 'in_progress', 20)
on conflict do nothing;

-- ── COMMUNITY POSTS ──────────────────────────────────────────
insert into posts (author_name, author_img, content, image_url, media_type, inspired, encouraged, learned) values
  ('Maya Chen',
   'https://i.pravatar.cc/150?img=1',
   'Just finished my pitch deck for the startup accelerator 🚀 18 months of building finally made real. Never stop. Never settle.',
   'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
   'image', 142, 38, 21),

  ('Jordan Williams',
   'https://i.pravatar.cc/150?img=3',
   'Library sessions hit different when you have a clear vision 📚 Research paper accepted. Two years of work, one page at a time.',
   'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
   'image', 89, 24, 56),

  ('Priya Patel',
   'https://i.pravatar.cc/150?img=5',
   '💡 The only way to build confidence is to do the scary thing — then do it again. Accountability circles open this week. DM if you want in.',
   null, 'image', 203, 67, 12),

  ('Alex Torres',
   'https://i.pravatar.cc/150?img=8',
   'Finished my congressional internship in DC 🏛️ When I started college I was terrified of public speaking. Now I''ve presented research to 3 senators. You grow into the rooms you put yourself in.',
   null, 'image', 76, 19, 34)
on conflict do nothing;

-- ── JOURNAL SEED (optional welcome entry) ────────────────────
insert into journal (content) values
  ('Welcome to your journal. This is your private space to process, plan, and reflect. Start writing anytime.')
on conflict do nothing;
