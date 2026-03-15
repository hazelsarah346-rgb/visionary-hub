-- Run this in Supabase SQL Editor after schema.sql (adds mentor profile columns)
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS email text;
