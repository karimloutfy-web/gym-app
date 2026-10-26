-- Rep Star — account sync: a private copy of each user's data
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run (if-not-exists / drop-policy-if-exists / create-or-replace throughout).

-- one row per user: everything the app keeps on the phone (program, workouts,
-- body entries, food log, settings) as one JSON document, so signing in on a new
-- or reinstalled phone brings it all back. Only the owner can read it.
-- delete_account() removes it too (cascade from auth.users).
create table if not exists public.user_data (
  user_id    uuid primary key references auth.users on delete cascade,
  data       jsonb not null,
  rev        bigint not null default 1,
  device_id  text,
  updated_at timestamptz not null default now(),
  check (pg_column_size(data) < 5 * 1024 * 1024)
);
alter table public.user_data enable row level security;

drop policy if exists "read own data" on public.user_data;
create policy "read own data" on public.user_data
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "delete own data" on public.user_data;
create policy "delete own data" on public.user_data
  for delete to authenticated using (auth.uid() = user_id);
-- no insert/update policies: writes go through put_user_data below

-- put_user_data: save the document only if nobody else saved since this phone
-- last read it (p_base_rev; 0 = first save). Returns the new rev, or null when
-- another phone got there first — the app then pulls, merges and tries again.
create or replace function public.put_user_data(p_data jsonb, p_base_rev bigint, p_device text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_rev bigint;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if p_base_rev = 0 then
    insert into public.user_data (user_id, data, device_id)
      values (auth.uid(), p_data, p_device)
      on conflict (user_id) do nothing
      returning rev into new_rev;
  else
    update public.user_data
      set data = p_data, rev = rev + 1, device_id = p_device, updated_at = now()
      where user_id = auth.uid() and rev = p_base_rev
      returning rev into new_rev;
  end if;
  return new_rev;
end;
$$;
revoke all on function public.put_user_data(jsonb, bigint, text) from public, anon;
grant execute on function public.put_user_data(jsonb, bigint, text) to authenticated;
