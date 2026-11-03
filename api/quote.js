// Serverless function (Vercel). Receives the quote form and emails it through Resend.
// The API key is read from the RESEND_API_KEY environment variable and never reaches the browser.
import { Resend } from "resend";

const TO = process.env.QUOTE_TO_EMAIL || "sreetejamediatechnology@gmail.com";
const FROM = process.env.QUOTE_FROM_EMAIL || "Sree Teja Quotes <onboarding@resend.dev>";

const SERVICES = {
  hardware: "Hardware Sales & Upgrades", rental: "Workstation Rental", network: "Network & Storage",
  servers: "On-Premises Servers", amc: "AMC & Support", home: "Home & Work-From-Home Support",
};
const GENERIC = /^\d{6,14}$/;
const COUNTRIES = {
  IN: ["+91", /^[6-9]\d{9}$/], AE: ["+971", GENERIC], US: ["+1", /^\d{10}$/], GB: ["+44", GENERIC],
  SG: ["+65", /^\d{8}$/], AU: ["+61", GENERIC], SA: ["+966", GENERIC], QA: ["+974", GENERIC],
};
const METHODS = ["WhatsApp", "Phone call"];

// 5 requests per IP per 10 minutes (in memory; resets on cold start).
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 600000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const str = (x) => (typeof x === "string" ? x : "");

function validate(v) {
  const e = {};
  const name = v.name.trim();
  if (!/^[A-Za-z\s]+$/.test(name) || name.length < 2 || name.length > 80) e.name = "Invalid name";
  const c = COUNTRIES[v.countryCode];
  if (!c || !c[1].test(v.phone)) e.phone = "Invalid mobile number";
  const email = v.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) e.email = "Invalid email";
  if (!SERVICES[v.service]) e.service = "Invalid service";
  if (v.area.trim().length > 80) e.area = "Too long";
  if (v.details.trim().length > 2000) e.details = "Too long";
  if (!METHODS.includes(v.contactMethod)) e.contactMethod = "Invalid method";
  return e;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return res.status(500).json({ error: "Email service not configured" });
  }
  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (limited(ip)) return res.status(429).json({ error: "Too many requests" });

  const b = req.body && typeof req.body === "object" ? req.body : {};
  if (str(b.website)) return res.status(200).json({ ok: true }); // honeypot: bots fill this hidden field

  const v = {
    name: str(b.name), countryCode: str(b.countryCode), phone: str(b.phone).replace(/[\s-]/g, ""), email: str(b.email),
    service: str(b.service), area: str(b.area), details: str(b.details), contactMethod: str(b.contactMethod),
  };
  const errors = validate(v);
  if (Object.keys(errors).length) return res.status(400).json({ error: "Please check the form fields", fields: errors });

  const [dial] = COUNTRIES[v.countryCode];
  const full = `${dial} ${v.phone}`;
  const rows = [
    ["Client name", v.name.trim()], ["Mobile number", full], ["Email", v.email.trim()],
    ["Location / area", v.area.trim() || "Not provided"], ["Service requested", SERVICES[v.service]],
    ["Preferred contact", v.contactMethod],
  ];
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;color:#17212B">
    <h2 style="margin:0 0 12px">New quote request</h2>
    <table style="border-collapse:collapse;width:100%">${rows.map(([k, x]) =>
      `<tr><td style="padding:8px;border:1px solid #D8DBDD;background:#F4F4F2;width:38%"><b>${k}</b></td><td style="padding:8px;border:1px solid #D8DBDD">${esc(x)}</td></tr>`).join("")}</table>
    <h3 style="margin:18px 0 6px">Project / workload details</h3>
    <p style="white-space:pre-wrap;margin:0">${esc(v.details.trim() || "Not provided")}</p>
    <p style="margin-top:18px"><a href="https://wa.me/${dial.slice(1)}${v.phone}">Reply on WhatsApp</a> | <a href="tel:${dial}${v.phone}">Call ${esc(full)}</a></p></div>`;
  const text = [...rows.map(([k, x]) => `${k}: ${x}`), "", "Details:", v.details.trim() || "Not provided"].join("\n");

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: FROM, to: [TO], replyTo: v.email.trim(),
    subject: `New quote request: ${SERVICES[v.service]} (${v.name.trim()})`, html, text,
  });
  if (error) {
    console.error("Resend error", error);
    return res.status(502).json({ error: "Email delivery failed" });
  }
  return res.status(200).json({ ok: true });
}
