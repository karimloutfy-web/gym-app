# gym-app

Personal strength-training PWA ("Rack Coach"). The app is the files at the repo
root (`index.html`, `sw.js`, `manifest.webmanifest`, icons). Older versions are in
`archive/`.

## Deploy

GitHub Pages, served from `main` branch root. Pushing to `main` redeploys.

Bump `CACHE` in `sw.js` after changing `index.html` so installed clients update.

## Local dev

`python3 -m http.server 8000` in the repo root, open http://localhost:8000/ .
Add `?selftest` to the URL to run the engine assertion suite.

## Data

All data is stored in the browser (localStorage). It does not sync between devices;
clearing site data erases it. Use Settings -> Export backup periodically.
