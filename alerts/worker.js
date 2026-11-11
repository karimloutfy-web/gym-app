// POST { subject, text } with header x-alert-secret → one plain-text email to ALERT_TO.
import { EmailMessage } from "cloudflare:email";

const FROM = "alerts@rep-star.app";

// RFC 2047 so names with accents or Arabic survive in the subject line
function encodeHeader(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return "=?UTF-8?B?" + btoa(bin) + "?=";
}

function sameSecret(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(req, env) {
    if (req.method !== "POST") return new Response("Not found", { status: 404 });
    if (!sameSecret(req.headers.get("x-alert-secret"), env.ALERT_SECRET)) return new Response("Unauthorized", { status: 401 });
    let body;
    try { body = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }
    const subject = String(body.subject || "Rep Star alert").replace(/[\r\n]+/g, " ").slice(0, 150);
    const text = String(body.text || "").slice(0, 8000).replace(/\r?\n/g, "\r\n");
    const raw = [
      "From: Rep Star alerts <" + FROM + ">",
      "To: " + env.ALERT_TO,
      "Subject: " + encodeHeader(subject),
      "Date: " + new Date().toUTCString(),
      "Message-ID: <" + crypto.randomUUID() + "@rep-star.app>",
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      text
    ].join("\r\n");
    try {
      await env.MAIL.send(new EmailMessage(FROM, env.ALERT_TO, raw));
    } catch (e) {
      return new Response("Send failed: " + e.message, { status: 502 });
    }
    return new Response("Sent");
  }
};
