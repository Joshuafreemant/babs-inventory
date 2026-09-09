import { SmsProvider, SmsSendResult } from "./types";

/**
 * Africa's Talking — local routing across 30+ African countries. One request
 * carries all recipients. Numbers must be sent in "+<countrycode>..." form.
 *
 * Env:
 *   AFRICASTALKING_USERNAME   - "sandbox" for testing, else your live username
 *   AFRICASTALKING_API_KEY    - from the AT dashboard (Settings > API Key)
 *   AFRICASTALKING_SENDER_ID  - optional; a registered alphanumeric sender ID or
 *                               shortcode. Omitted -> AT's shared pool.
 *   AFRICASTALKING_BASE_URL   - optional override
 *
 * Sandbox uses api.sandbox.africastalking.com automatically when username=sandbox.
 */

function baseUrl(): string {
  if (process.env.AFRICASTALKING_BASE_URL) return process.env.AFRICASTALKING_BASE_URL;
  return process.env.AFRICASTALKING_USERNAME === "sandbox"
    ? "https://api.sandbox.africastalking.com"
    : "https://api.africastalking.com";
}

// AT delivery status codes that mean "accepted": Sent / Submitted / Queued / Processed
const OK_CODES = new Set([100, 101, 102]);

export const africasTalking: SmsProvider = {
  key: "africastalking",
  label: "Africa's Talking",
  configured() {
    return Boolean(process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME);
  },
  senderId() {
    return process.env.AFRICASTALKING_SENDER_ID || "(shared pool)";
  },
  async send(numbers, message): Promise<SmsSendResult> {
    const apiKey = process.env.AFRICASTALKING_API_KEY as string;
    const username = process.env.AFRICASTALKING_USERNAME as string;
    const senderId = process.env.AFRICASTALKING_SENDER_ID;

    const to = numbers.map((n) => (n.startsWith("+") ? n : "+" + n)).join(",");
    const form = new URLSearchParams({ username, to, message });
    if (senderId) form.set("from", senderId);

    try {
      const res = await fetch(`${baseUrl()}/version1/messaging`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          apiKey,
        },
        body: form.toString(),
      });

      const bodyText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(bodyText);
      } catch {
        // AT returns plain text for auth/permission errors
        data = { errorMessage: bodyText };
      }

      if (!res.ok) {
        const err =
          data?.SMSMessageData?.Message || data?.errorMessage || bodyText || `HTTP ${res.status}`;
        console.error("[sms:africastalking] request failed:", res.status, bodyText);
        return { ok: false, sent: 0, failed: numbers.length, error: err };
      }

      const recipients: any[] = data?.SMSMessageData?.Recipients || [];
      console.log("[sms:africastalking] response:", JSON.stringify(data?.SMSMessageData));

      if (recipients.length === 0) {
        // e.g. invalid sender id, no balance, blacklisted — AT explains in Message
        return {
          ok: false,
          sent: 0,
          failed: numbers.length,
          error: data?.SMSMessageData?.Message || "No recipients accepted (check sender ID / balance).",
        };
      }

      const sent = recipients.filter((r) => OK_CODES.has(Number(r.statusCode))).length;
      const failed = numbers.length - sent;
      const firstFail = recipients.find((r) => !OK_CODES.has(Number(r.statusCode)));
      return {
        ok: failed === 0 && sent > 0,
        sent,
        failed,
        error: firstFail ? `${firstFail.number}: ${firstFail.status}` : undefined,
      };
    } catch (err: any) {
      console.error("[sms:africastalking] errored:", err?.message);
      return { ok: false, sent: 0, failed: numbers.length, error: err?.message || "network error" };
    }
  },
};
