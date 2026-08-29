# Rack Coach

A personal strength-training coach — a single-page web app that runs a proven barbell
program (Starting Strength, StrongLifts 5×5, Texas Method), sets your working weights from
a rep test, walks you through each session, and tracks weekly progress plus bodyweight and
measurements.

Built for one person's own use. Local-first: all data is stored in the browser
(`localStorage`), nothing is sent anywhere, and it works offline.

## What's in here

| Path | What it is |
|---|---|
| `rack-coach-app/` | **The app.** Deployed as a PWA — this is the canonical version. |
| `rack-coach-app/index.html` | Whole app: markup, styles, and logic in one file (vanilla JS, no build step). |
| `rack-coach-app/sw.js` | Service worker — caches the app shell so it runs with no signal. |
| `rack-coach-app/manifest.webmanifest` | PWA manifest (name, icons, standalone display). |
| `rack-coach-app/icon-*.png`, `apple-touch-icon.png` | Home-screen icons. |
| `strength-coach.html` | Earlier single-file version, published as a Claude artifact. Kept in sync by hand; may be dropped. |
| `palette.html` | "Arcane Teal" colour-scheme reference (the design tokens used by the app). |
| `iron-log.html` | Abandoned first attempt (a freeform set logger). Kept for reference only. |

## Run locally

No build step. Serve the folder over HTTP (needed for the service worker and for
`localStorage` to persist):

```bash
cd rack-coach-app
python3 -m http.server 8791
```

Then open http://localhost:8791/ .

## Tests

The engine (program generation, weight rounding, progression, deloads) has an in-page
assertion suite. Open the app with `?selftest` in the URL:

```
http://localhost:8791/?selftest
```

It renders PASS/FAIL for every check and does not touch your saved data.

## Deploy

Hosted on Netlify with the publish directory set to `rack-coach-app`. Pushing to `main`
triggers an automatic deploy.

To bump the offline cache after changing `index.html` or an icon, increment `CACHE` in
`rack-coach-app/sw.js` so installed clients pick up the new version.

## Data / backups

Data lives only in the browser it was entered in — it does not sync between devices, and
clearing the site's data erases it. Use **Settings → Export backup** every few weeks; it
downloads a JSON file that **Settings → Restore** reads back.
