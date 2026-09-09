/**
 * Verify SMS provider credentials straight from .env, before wiring them into the app.
 *   node scripts/sms-check.mjs            # checks the active SMS_PROVIDER
 *   node scripts/sms-check.mjs +23480...  # also sends a real test SMS to that number
 */
import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const provider = (process.env.SMS_PROVIDER || "termii").toLowerCase().replace(/[^a-z]/g, "");
const testNumber = process.argv[2];
console.log(`SMS_PROVIDER = ${provider}\n`);

async function checkTermii() {
  const key = process.env.TERMII_API_KEY;
  if (!key) return console.log("TERMII_API_KEY not set");
  const base = process.env.TERMII_BASE_URL || "https://api.ng.termii.com";
  const bal = await fetch(`${base}/api/get-balance?api_key=${key}`).then((r) => r.json());
  console.log("balance:", bal);
  const sid = await fetch(`${base}/api/sender-id?api_key=${key}`).then((r) => r.json());
  console.log("registered sender IDs:", JSON.stringify(sid.content ?? sid));
  if (testNumber) {
    const res = await fetch(`${base}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: testNumber.replace(/^\+/, ""),
        from: process.env.TERMII_SENDER_ID,
        sms: "Embassy Pharmaceutical: credentials check.",
        type: "plain",
        channel: process.env.TERMII_CHANNEL || "dnd",
        api_key: key,
      }),
    });
    console.log("send:", res.status, await res.text());
  }
}

async function checkAT() {
  const key = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;
  if (!key || !username) return console.log("AFRICASTALKING_USERNAME / _API_KEY not set");
  const base =
    process.env.AFRICASTALKING_BASE_URL ||
    (username === "sandbox" ? "https://api.sandbox.africastalking.com" : "https://api.africastalking.com");
  const who = await fetch(`${base}/version1/user?username=${username}`, {
    headers: { apiKey: key, Accept: "application/json" },
  });
  console.log("user/balance:", who.status, await who.text());
  if (testNumber) {
    const form = new URLSearchParams({ username, to: testNumber, message: "Embassy Pharmaceutical: credentials check." });
    if (process.env.AFRICASTALKING_SENDER_ID) form.set("from", process.env.AFRICASTALKING_SENDER_ID);
    const res = await fetch(`${base}/version1/messaging`, {
      method: "POST",
      headers: { apiKey: key, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: form.toString(),
    });
    console.log("send:", res.status, await res.text());
  }
}

(provider === "africastalking" ? checkAT() : checkTermii()).catch(console.error);
