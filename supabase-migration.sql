-- Rack Coach — social MVP schema
-- Run once in Supabase → SQL Editor → New query → paste → Run.

-- one row per user, created on first sign-in
create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 30),
  created_at   timestamptz not null default now()
);

-- one row per completed session, pushed from the device.
-- user_id references profiles (not auth.users directly) so PostgREST can
-- resolve the `profiles(display_name)` embed the feed query uses. A profile
-- row is always created at sign-in before any workout is published.
create table if not exists public.workouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  completed_at  timestamptz not null,
  program_name  text,
  day_label     text,
  duration_sec  integer,
  summary       jsonb not null default '{}',
  client_id     text,
  created_at    timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists workouts_feed_idx on public.workouts (completed_at desc);

alter table public.profiles enable row level security;
alter table public.workouts enable row level security;

-- any signed-in user can read all profiles + all workouts (global feed)
create policy "read profiles" on public.profiles
  for select to authenticated using (true);
create policy "read workouts" on public.workouts
  for select to authenticated using (true);

-- you may only write your own rows
create policy "insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "insert own workout" on public.workouts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "update own workout" on public.workouts
  for update to authenticated using (auth.uid() = user_id);
create policy "delete own workout" on public.workouts
  for delete to authenticated using (auth.uid() = user_id);
