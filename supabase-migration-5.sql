-- Rep Star: email alert for every new report (App Store guideline 1.2: act within 24 hours).
-- On insert into public.reports, Postgres POSTs the report to the rep-star-alerts
-- Cloudflare Worker (alerts/), which emails it to you.
--
-- BEFORE running this file, store the Worker's URL and shared secret in Vault
-- (SQL editor, once; the values never go in git):
--   select vault.create_secret('https://alerts.rep-star.app', 'alert_url');
--   select vault.create_secret('<the ALERT_SECRET you gave wrangler>', 'alert_secret');
-- Safe to re-run.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_report()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url      text;
  v_secret   text;
  v_reporter text;
  v_reported text;
  v_owner    uuid;
  v_post     text;
  v_text     text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'alert_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'alert_secret';
  if v_url is null or v_secret is null then
    return new;
  end if;

  select display_name into v_reporter from public.profiles where id = new.reporter_id;
  v_owner := new.reported_user_id;
  if new.workout_id is not null then
    select w.user_id,
           concat_ws(' · ', nullif(w.program_name, ''), nullif(w.day_label, ''), to_char(w.completed_at, 'DD Mon YYYY'))
      into v_owner, v_post
      from public.workouts w where w.id = new.workout_id;
    v_owner := coalesce(new.reported_user_id, v_owner);
  end if;
  select display_name into v_reported from public.profiles where id = v_owner;

  v_text := concat_ws(E'\n',
    'New report in Rep Star. Review it within 24 hours.',
    '',
    'Reason:   ' || new.reason,
    'Details:  ' || coalesce(nullif(new.details, ''), '(none)'),
    'Reported: ' || coalesce(v_reported, '(unknown)') || ' — user ' || coalesce(v_owner::text, '(none)'),
    'Post:     ' || coalesce(v_post, '(the whole profile)') || coalesce(' — workout ' || new.workout_id::text, ''),
    'By:       ' || coalesce(v_reporter, '(unknown)') || ' — user ' || new.reporter_id::text,
    'When:     ' || to_char(new.created_at at time zone 'UTC', 'DD Mon YYYY HH24:MI') || ' UTC',
    'Report:   ' || new.id::text,
    '',
    'If it breaks the terms: delete the post (Table editor → workouts) and remove the account',
    '(Authentication → Users → delete user). Reports table:',
    'https://supabase.com/dashboard/project/sfskyokfctaqzlbgztjx/editor'
  );

  perform net.http_post(
    url     := v_url,
    body    := jsonb_build_object('subject', 'Rep Star report: ' || new.reason || ' — ' || coalesce(v_reported, 'unknown user'), 'text', v_text),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-alert-secret', v_secret)
  );
  return new;
exception when others then
  -- an alert problem must never stop the report itself from being saved
  return new;
end;
$$;

revoke all on function public.notify_report() from public, anon, authenticated;

drop trigger if exists reports_alert on public.reports;
create trigger reports_alert
  after insert on public.reports
  for each row execute function public.notify_report();
