-- Rack Coach — App Store requirements: report, block, delete account
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run (if-not-exists / drop-policy-if-exists / create-or-replace throughout).

-- reports: anyone signed in can report a post or a person (App Store guideline 1.2).
-- Nobody can read reports from the app — review them in the Supabase dashboard
-- (Table editor → reports) and act within 24 hours.
create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  workout_id       uuid references public.workouts(id) on delete set null,
  reason           text not null check (char_length(reason) between 2 and 40),
  details          text check (details is null or char_length(details) <= 500),
  created_at       timestamptz not null default now(),
  check (reported_user_id is not null or workout_id is not null)
);
alter table public.reports enable row level security;
drop policy if exists "insert own report" on public.reports;
create policy "insert own report" on public.reports
  for insert to authenticated with check (auth.uid() = reporter_id);

-- blocks: one row per (blocker, blocked) pair; only the blocker can see or change it
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
drop policy if exists "read own blocks" on public.blocks;
create policy "read own blocks" on public.blocks
  for select to authenticated using (auth.uid() = blocker_id);
drop policy if exists "insert own block" on public.blocks;
create policy "insert own block" on public.blocks
  for insert to authenticated with check (auth.uid() = blocker_id);
drop policy if exists "delete own block" on public.blocks;
create policy "delete own block" on public.blocks
  for delete to authenticated using (auth.uid() = blocker_id);

-- the feed hides workouts from anyone you've blocked, on the server
drop policy if exists "read workouts" on public.workouts;
create policy "read workouts" on public.workouts
  for select to authenticated using (
    not exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = workouts.user_id)
  );

-- delete_account: removes the signed-in user. profiles, workouts, follows, kudos,
-- blocks and reports all cascade from auth.users → profiles. The app deletes the
-- user's avatar files through the Storage API first (Storage blocks SQL deletes).
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
