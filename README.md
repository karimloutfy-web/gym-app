# gym-app

Personal hybrid-training PWA ("Rep Star", formerly "Rack Coach"). The app is the files at the repo
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

## iOS app (Capacitor)

The App Store build wraps the same `index.html` in a native shell (`ios/`, bundle ID `app.rep-star.ios`).

    npm install
    npm run ios        # copies the web files into www/ and syncs them into ios/

Then open `ios/App/App.xcodeproj` in Xcode and run. In the app, data is mirrored to native storage
(Capacitor Preferences) so iOS can't clear it, sign-in returns through `repstar://auth-callback`
(add it in Supabase → Authentication → URL Configuration → Redirect URLs), and the service worker is off.
`capacitor.config.json` says `app.repstar.ios` only because the Capacitor CLI rejects hyphens; Xcode holds the real ID.
