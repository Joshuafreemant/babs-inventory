/**
 * SMS facade. Pick the provider with SMS_PROVIDER in .env: "termii" (default)
 * or "africastalking". Recipient fan-out lives in `app/lib/notify.ts`.
 *
 * Sending is server-side only. If the active provider isn't configured, sends
 * are skipped (logged) and the caller still succeeds — an order must never fail
 * because an SMS didn't go out.
 */
import { SmsProvider, SmsSendResult } from "./types";
import { termii } from "./termii";
import { africasTalking } from "./africastalking";

export type { SmsSendResult } from "./types";

const PROVIDERS: Record<string, SmsProvider> = {
  [termii.key]: termii,
  [africasTalking.key]: africasTalking,
};

export function activeProvider(): SmsProvider {
  const raw = (process.env.SMS_PROVIDER || "termii").toLowerCase().replace(/[^a-z]/g, "");
  return PROVIDERS[raw] || termii;
}

export function providerLabel(): string {
  return activeProvider().label;
}

export function smsConfigured(): boolean {
  return activeProvider().configured();
}

export function senderId(): string {
  return activeProvider().senderId();
}

/** Send one message to an explicit list of numbers. Never throws. */
export async function sendSms(numbers: string[], message: string): Promise<SmsSendResult> {
  const provider = activeProvider();
  if (!provider.configured()) {
    console.warn(`[sms:${provider.key}] not configured — skipping:`, message);
    return { ok: false, skipped: true };
  }
  if (numbers.length === 0) {
    return { ok: false, skipped: true, error: "No recipients." };
  }
  return provider.send(numbers, message);
}

/** Keep the body in the GSM-7 alphabet so one SMS part stays 160 chars, not 70. */
function gsmSafe(s: string): string {
  return s
    .replace(/[‒-―]/g, "-") // dashes
    .replace(/[‘’′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/…/g, "...")
    .replace(/₦/g, "NGN ")
    .replace(/[^\x00-\x7F]/g, "");
}

/** Compose the new-order alert text, itemised. */
export function newOrderMessage(o: {
  code: string;
  customerName: string;
  phone: string;
  items: { name: string; qty: number }[];
  itemsQty: number;
  total: number;
  methodLabel: string;
}): string {
  // cap the itemised list so a big order doesn't balloon into 4+ SMS parts
  const MAX_LINES = 6;
  const shown = o.items.slice(0, MAX_LINES).map((i) => `- ${i.name} x${i.qty}`);
  if (o.items.length > MAX_LINES) {
    shown.push(`- ...and ${o.items.length - MAX_LINES} more item(s)`);
  }
  const lines = shown.join("\n");
  const msg =
    `Embassy new order ${o.code}\n` +
    `From: ${o.customerName} (${o.phone})\n` +
    `${lines}\n` +
    `${o.itemsQty} item${o.itemsQty === 1 ? "" : "s"}, NGN ${o.total.toLocaleString("en-NG")}\n` +
    `${o.methodLabel}`;
  return gsmSafe(msg);
}
