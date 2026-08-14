-- ============================================================
-- EA Command Center — Supabase schema
-- Run this once in your Supabase project's SQL Editor.
-- ============================================================

-- The whole board is stored as one JSON document (matches how the app works).
create table if not exists public.boards (
  id          text primary key,
  data        jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Turn on Row Level Security.
alter table public.boards enable row level security;

-- ------------------------------------------------------------
-- QUICK-START POLICY (single-user internal tool)
-- Allows the anon key to read/write the board. This is the fastest
-- way to launch. NOTE: anyone who has your app URL + anon key could
-- read/write this table. Fine for a private internal tool short-term.
-- For real protection, delete this policy and use the AUTH option below.
-- ------------------------------------------------------------
drop policy if exists "anon full access" on public.boards;
create policy "anon full access"
  on public.boards
  for all
  to anon
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- OPTIONAL — LOCK IT DOWN WITH AUTH (recommended next step)
-- 1) In Supabase: Authentication -> Providers -> enable Email.
-- 2) Add yourself as a user (Authentication -> Users -> Add user).
-- 3) Replace the policy above with the authenticated-only one below,
--    and add Supabase Auth sign-in to the app (ask Claude to wire it).
-- ------------------------------------------------------------
-- drop policy if exists "anon full access" on public.boards;
-- create policy "authenticated only"
--   on public.boards
--   for all
--   to authenticated
--   using (true)
--   with check (true);
