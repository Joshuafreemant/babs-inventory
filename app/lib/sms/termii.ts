import { SmsProvider, SmsSendResult } from "./types";

/**
 * Termii — Nigeria-focused: direct carrier delivery on all four networks and a
 * transactional/DND route that reaches DND-registered lines. Requires an
 * approved Sender ID on the workspace.
 *
 * Numbers arrive normalised as country-code digits, no "+": 2348030000000.
 */

const BASE = process.env.TERMII_BASE_URL || "https://api.ng.termii.com";
const CHANNEL = process.env.TERMII_CHANNEL || "dnd"; // dnd = transactional; "generic" also valid

async function sendOne(to: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const api_key = process.env.TERMII_API_KEY as string;
  const from = process.env.TERMII_SENDER_ID as string;
  try {
    const res = await fetch(`${BASE}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, from, sms: message, type: "plain", channel: CHANNEL, api_key }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.status >= 400) {
      console.error(`[sms:termii] ${to} failed:`, JSON.stringify(data));
      return { ok: false, error: data?.message || `HTTP ${res.status}` };
    }
    console.log(`[sms:termii] ${to} ok:`, JSON.stringify(data));
    return { ok: true };
  } catch (err: any) {
    console.error(`[sms:termii] ${to} errored:`, err?.message);
    return { ok: false, error: err?.message || "network error" };
  }
}

export const termii: SmsProvider = {
  key: "termii",
  label: "Termii",
  configured() {
    return Boolean(process.env.TERMII_API_KEY && process.env.TERMII_SENDER_ID);
  },
  senderId() {
    return process.env.TERMII_SENDER_ID || "";
  },
  async send(numbers, message): Promise<SmsSendResult> {
    const results = await Promise.all(numbers.map((n) => sendOne(n, message)));
    const sent = results.filter((r) => r.ok).length;
    const failed = results.length - sent;
    return { ok: failed === 0, sent, failed, error: results.find((r) => r.error)?.error };
  },
};
