// Copies the web app into www/ for the iOS build (npx cap sync ios).
// The PWA is still served from the repo root; www/ is a build output.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "www");
const files = [
  "index.html", "data-programs.js", "data-wods.js", "data-badges.js",
  "privacy.html", "manifest.webmanifest", "icon.svg", "favicon-32.png",
  "icon-192.png", "icon-512.png", "apple-touch-icon.png"
];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const f of files) fs.copyFileSync(path.join(root, f), path.join(out, f));

// the native bridge needs Capacitor's core script; the PWA never loads it
const marker = "<!-- the iOS build (scripts/build-www.js) loads capacitor.js here -->";
const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
if (!html.includes(marker)) throw new Error("capacitor.js marker missing from index.html");
fs.writeFileSync(path.join(out, "index.html"), html.replace(marker, '<script src="capacitor.js"></script>'));
fs.copyFileSync(path.join(root, "node_modules/@capacitor/core/dist/capacitor.js"), path.join(out, "capacitor.js"));
console.log("www/: " + files.length + " files");
