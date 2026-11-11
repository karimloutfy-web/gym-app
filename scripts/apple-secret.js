// Makes the "Secret Key (for OAuth)" Supabase needs for Sign in with Apple.
// Apple caps it at 6 months, so re-run before it expires and paste the output into
// Supabase → Authentication → Sign In / Providers → Apple → Secret Key.
//   node scripts/apple-secret.js ~/path/AuthKey_ZYWCB4G8D9.p8 ZYWCB4G8D9 WTHP76VQP2 app.rep-star.signin out.txt
// args: .p8 key file, Key ID, Team ID, Services ID, output file (never commit the .p8 or the output)
const fs = require("fs"), crypto = require("crypto");
const [keyPath, kid, team, sub, out] = process.argv.slice(2);
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
const now = Math.floor(Date.now() / 1000), exp = now + 180 * 24 * 3600;   // Apple max is 6 months
const data = b64({ alg: "ES256", kid }) + "." + b64({ iss: team, iat: now, exp, aud: "https://appleid.apple.com", sub });
const sig = crypto.sign("sha256", Buffer.from(data), { key: fs.readFileSync(keyPath), dsaEncoding: "ieee-p1363" });
fs.writeFileSync(out, data + "." + sig.toString("base64url"));
console.log("expires " + new Date(exp * 1000).toISOString().slice(0, 10));
