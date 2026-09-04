# Rack Coach — Social MVP plan

Goal: email-OTP login, user profiles, and a single global activity feed
("who worked out, when, what"). Everything else (follows, kudos, comments,
avatars, push, privacy controls, block/report) is explicitly out of scope for
this pass.

The app stays **local-first**: logged out, it works exactly as it does today.
The social layer is additive and lives behind sign-in.

---

## 1. Backend — Supabase

**Why:** hosted Postgres + auth + row-level security + a JS client that loads
from a CDN. No server for us to run. Free tier is far more than enough.

### One-time setup (you do this, ~15 min)

1. Create a free project at supabase.com. Pick a region near you.
2. Send me the **Project URL** and the **anon/public key**
   (Settings → API). The anon key is meant to live in client code — RLS is
   what protects the data, not key secrecy.
3. **Email delivery:** Supabase's built-in email is throttled to ~2 messages
   per hour and is "development only". That will not work even for a handful
   of friends. Set up custom SMTP early:
   - Create a free Resend account (resend.com), verify an email/domain,
     make an API key.
   - In Supabase → Authentication → Emails → SMTP, paste the Resend SMTP
     credentials.
   - Free Resend tier is 100 emails/day / 3,000/month — plenty.
4. In Supabase → Authentication → Providers, make sure **Email** is enabled
   and "Confirm email" / OTP is on. Disable the "Enable email signups"
   toggle only if you want invite-only later; leave on for now.
5. Run the SQL migration below (Supabase → SQL Editor).

### Schema

```sql
-- profiles: one row per user, created on first sign-in
create table public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 30),
  created_at   timestamptz not null default now()
);

-- workouts: one row per completed session, pushed from the device
create table public.workouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  completed_at  timestamptz not null,
  program_name  text,
  day_label     text,
  duration_sec  integer,
  summary       jsonb not null default '{}',   -- compact: top lifts, set counts, PR flags
  client_id     text,                          -- the local session.id, for dedupe
  created_at    timestamptz not null default now(),
  unique (user_id, client_id)
);

create index workouts_feed_idx on public.workouts (completed_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;

-- any signed-in user can read all profiles and all workouts (global feed)
create policy "read profiles"  on public.profiles for select to authenticated using (true);
create policy "read workouts"  on public.workouts for select to authenticated using (true);

-- you may only write your own rows
create policy "insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "insert own workout" on public.workouts for insert to authenticated with check (auth.uid() = user_id);
create policy "delete own workout" on public.workouts for delete to authenticated using (auth.uid() = user_id);
```

`summary` shape (kept small on purpose — not the full session snapshot):

```json
{
  "lifts": [
    { "name": "Squat", "weight": 100, "reps": 5, "sets": 5, "pr": false },
    { "name": "Bench", "weight": 80,  "reps": 5, "sets": 5, "pr": true }
  ],
  "kind": "strength",
  "dayType": "volume"
}
```

---

## 2. Client changes (`index.html`)

The app is one IIFE with no build step. The Supabase client is an ES module,
so it loads in its own `<script type="module">` that exposes a small bridge on
`window` and fires events the main script listens for.

### 2.1 Config + client load

- Add near the top of `<head>`:
  ```html
  <script type="module">
    import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
    window.RC = window.RC || {};
    window.RC.sb = createClient("<PROJECT_URL>", "<ANON_KEY>", {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    window.dispatchEvent(new Event("rc-sb-ready"));
  </script>
  ```
- supabase-js stores its own session in `localStorage` under its own keys —
  independent of our `rackcoach.v1` blob.

### 2.2 State

Extend `defaults()` / the `db` object:

```js
account: null,        // { userId, displayName } once signed in, else null
pendingPush: []        // local session ids waiting to sync
```

These persist in the existing `save()` path — no new storage mechanism.

### 2.3 Auth flow (new small module of functions)

- `rcSignInRequest(email)` → `sb.auth.signInWithOtp({ email })`
- `rcSignInVerify(email, code)` → `sb.auth.verifyOtp({ email, token: code, type: "email" })`
- On success:
  - read `profiles` row for `auth.uid()`
  - if none or no `display_name` → show the "choose a display name" prompt →
    `insert` into `profiles`
  - set `db.account = { userId, displayName }`, `save()`
  - flush `pendingPush`
- `rcSignOut()` → `sb.auth.signOut()`, `db.account = null`, hide feed tab.
- On load, after `rc-sb-ready`: `sb.auth.getSession()` → restore `db.account`.

### 2.4 UI entry points

- **Settings screen:** a "Account" block — "Sign in to share workouts" when
  logged out; display name + "Sign out" when logged in.
- Sign-in screen: two-step (email → 6-digit code). Can be a lightweight
  modal/overlay rather than a full new `screens.*` entry.
- Display-name prompt: single text field, 2–30 chars, shown once.

### 2.5 Publishing a workout

Single choke point already exists: `finishAndCelebrate(sess, cb)` at
`index.html:2507` runs for all three completion paths
(`index.html:1780`, `:3394`, `:3618`).

Add there:

```js
if (db.account) rcPublishWorkout(sess);
```

`rcPublishWorkout(sess)`:
- build the compact `summary` from `sess.actual` (top weight/reps per lift,
  PR flags already computed in the session)
- `sb.from("workouts").upsert({ ... , client_id: sess.id }, { onConflict: "user_id,client_id" })`
- on network failure → push `sess.id` to `db.pendingPush`, `save()`, retry on
  next load / next completion
- `upsert` + the `unique(user_id, client_id)` constraint makes retries safe

**Historical sessions:** do **not** bulk-upload old `db.sessions` on sign-in.
Only workouts completed after sign-in are published. Optional later: a
"share my last 5 workouts" button.

### 2.6 The feed

New screen `s-feed` + a 5th tab (only visible when `db.account`).

- Query:
  ```js
  sb.from("workouts")
    .select("id, completed_at, program_name, day_label, duration_sec, summary, profiles(display_name)")
    .order("completed_at", { ascending: false })
    .range(0, 49)
  ```
  (add a `profiles`→`workouts` FK so the embedded select works)
- Render each item: display name, relative time (`relDate()` already exists),
  program + day label, 2–3 lift lines from `summary.lifts`, duration.
- "Load more" → bump `.range()`.
- Manual refresh button (pull-to-refresh is a nice-to-have, not MVP).
- Empty state: "No workouts yet — finish a session to be the first."
- Own workouts appear in the feed too (no filtering).

### 2.7 Tab bar

`TAB_ORDER`, `TAB_SCREENS`, `DEPTH`, `screens{}` all get a `feed` entry.
`renderTabs()` gains a check: feed tab hidden unless `db.account`.

---

## 3. Build phases

| Phase | Work | Who | Est. |
|---|---|---|---|
| 0 | Supabase project + Resend SMTP + run migration | you | 15–20 min |
| 1 | Client load, sign-in modal (email→code), session restore, display-name prompt, profile row | me | ~0.5 day |
| 2 | `rcPublishWorkout` + `pendingPush` queue + hook into `finishAndCelebrate` | me | ~0.5 day |
| 3 | `s-feed` screen + tab + query + rendering + load-more | me | ~0.5 day |
| 4 | Error/loading/empty states, sign-out, offline behavior, `sw.js` cache bump, self-test pass | me | ~0.5 day |
| 5 | Test with 2–3 real accounts on real devices, fix what breaks, deploy | both | ~1 day |

Wall-clock: roughly a week, gated mostly by phase 0 and phase 5 round-trips.

---

## 4. Testing

- Local: `python3 -m http.server 8000`, sign in with a real email, verify the
  code arrives (Resend dashboard shows sends).
- Second identity: another browser profile / incognito + a second email.
- Check: RLS actually blocks writing someone else's row (try it in the SQL
  editor as `anon`), offline completion queues and later syncs, duplicate
  publish is idempotent.
- `?selftest` engine suite must still pass.

---

## 5. Known limitations (accepted for MVP, revisit before public launch)

- **No block / report / moderation.** Fine for friends; **required** before
  the App Store or opening to strangers (Apple Guideline 1.2).
- Display names are not unique and not verified — impersonation is possible.
- No privacy controls — every signed-in user sees every workout.
- No follows — the feed is everyone, newest first. Will not scale past a few
  hundred active users without a follow graph + pagination rework.
- Anon key is public in the page source — expected; RLS is the boundary.
- No account deletion UI yet (GDPR: can be done manually in Supabase on
  request short-term; needs a real button before public).

---

## 6. Cost

- Supabase: $0 (free tier)
- Resend: $0 (free tier, 3k/month)
- Total: $0 until meaningful scale, then ~$25/mo Supabase Pro.
