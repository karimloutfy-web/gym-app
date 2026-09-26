-- Rack Coach — follow, kudos, profile picture
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run (if-not-exists / on-conflict / drop-policy-if-exists throughout).

-- profile picture
alter table public.profiles add column if not exists avatar_url text;

-- follows: one row per (follower, followee) pair
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
alter table public.follows enable row level security;

drop policy if exists "read follows" on public.follows;
create policy "read follows" on public.follows
  for select to authenticated using (true);
drop policy if exists "insert own follow" on public.follows;
create policy "insert own follow" on public.follows
  for insert to authenticated with check (auth.uid() = follower_id);
drop policy if exists "delete own follow" on public.follows;
create policy "delete own follow" on public.follows
  for delete to authenticated using (auth.uid() = follower_id);

-- kudos: one row per (workout, giver) pair
create table if not exists public.kudos (
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (workout_id, user_id)
);
alter table public.kudos enable row level security;

drop policy if exists "read kudos" on public.kudos;
create policy "read kudos" on public.kudos
  for select to authenticated using (true);
drop policy if exists "insert own kudos" on public.kudos;
create policy "insert own kudos" on public.kudos
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "delete own kudos" on public.kudos;
create policy "delete own kudos" on public.kudos
  for delete to authenticated using (auth.uid() = user_id);

-- avatar storage: a public bucket, writable only to your own folder (avatars/<user_id>/...)
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

drop policy if exists "avatar public read" on storage.objects;
create policy "avatar public read" on storage.objects
  for select using (bucket_id = 'avatars');
drop policy if exists "avatar own insert" on storage.objects;
create policy "avatar own insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar own update" on storage.objects;
create policy "avatar own update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar own delete" on storage.objects;
create policy "avatar own delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
