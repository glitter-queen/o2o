-- ============================================================
-- EA Command Center + Launchpad — Supabase schema
-- Safe to re-run: only creates things if missing.
-- Run this in your Supabase project's SQL Editor.
-- ============================================================

-- 1) The task board (whole board stored as one JSON document).
create table if not exists public.boards (
  id          text primary key,
  data        jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

-- 2) Launchpad field notes (one row per note).
create table if not exists public.field_notes (
  id          text primary key,
  text        text not null default '',
  tag         text,
  created_at  timestamptz not null default now()
);

-- 3) Launchpad call recordings (one row per recording).
create table if not exists public.recordings (
  id          text primary key,
  title       text not null default '',
  rec_date    text,          -- stored as YYYY-MM-DD
  link        text,          -- replay / share link
  notes       text not null default '',
  created_at  timestamptz not null default now()
);

-- Row Level Security on all three.
alter table public.boards       enable row level security;
alter table public.field_notes  enable row level security;
alter table public.recordings   enable row level security;

-- Quick-start policies: allow the anon key to read/write.
-- Fine for a private internal tool. See the AUTH note at the bottom to lock down.
drop policy if exists "anon full access" on public.boards;
create policy "anon full access" on public.boards for all to anon using (true) with check (true);

drop policy if exists "anon full access notes" on public.field_notes;
create policy "anon full access notes" on public.field_notes for all to anon using (true) with check (true);

drop policy if exists "anon full access recs" on public.recordings;
create policy "anon full access recs" on public.recordings for all to anon using (true) with check (true);

-- ------------------------------------------------------------
-- OPTIONAL — lock to just you with Supabase Auth (recommended later).
-- Enable Email auth, add yourself as a user, then swap each policy's
-- "to anon" for "to authenticated". Ask Claude to add a sign-in screen.
-- ------------------------------------------------------------
