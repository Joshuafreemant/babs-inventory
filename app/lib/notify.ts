/**
 * Order alerts — one place that fans a new order out to every active SMS
 * recipient, plus every staff device that's turned on push notifications.
 */
import { dbConnect } from "./db";
import AlertRecipientModel from "@/models/AlertRecipient";
import { normalizePhone } from "./phone";
import { sendSms, smsConfigured, providerLabel, senderId, newOrderMessage } from "./sms";
import { sendPushToAllStaff, pushConfigured } from "./webpush";
import { naira } from "./money";

function envNumbers(): string[] {
  return (process.env.ADMIN_ALERT_NUMBERS || "")
    .split(",")
    .map((n) => normalizePhone(n))
    .filter((n): n is string => Boolean(n));
}

export async function recipientPhones(): Promise<string[]> {
  let phones: string[] = [];
  try {
    await dbConnect();
    const docs = await AlertRecipientModel.find({ active: true }).lean();
    phones = docs.map((d: any) => d.phone).filter(Boolean);
  } catch (err) {
    console.error("[notify] could not read recipients", err);
  }
  return Array.from(new Set([...phones, ...envNumbers()]));
}

export function notifyStatus() {
  return {
    sms: { configured: smsConfigured(), provider: providerLabel(), senderId: senderId() },
    push: { configured: pushConfigured() },
  };
}

const skipped = { ok: false as const, skipped: true as const };

export interface NewOrderInfo {
  code: string;
  customerName: string;
  phone: string;
  items: { name: string; qty: number; lineTotal: number }[];
  boxes: number;
  total: number;
  methodLabel: string;
  refName?: string;
  hasBackorder?: boolean;
}

/** SMS every active recipient + push every subscribed staff device about a new order. Never throws. */
export async function notifyNewOrder(o: NewOrderInfo) {
  const phones = await recipientPhones();

  const smsText = newOrderMessage({
    code: o.code,
    customerName: o.customerName,
    phone: o.phone,
    items: o.items,
    boxes: o.boxes,
    total: o.total,
    methodLabel: o.methodLabel,
  });

  const [sms, push] = await Promise.all([
    phones.length ? sendSms(phones, smsText) : Promise.resolve(skipped),
    sendPushToAllStaff({
      title: `New order · ${o.code}`,
      body: `${o.customerName} · ${o.boxes} box${o.boxes === 1 ? "" : "es"} · ${naira(o.total)}`,
      url: "/console",
    }),
  ]);
  return { sms, push, phones: phones.length };
}

/** Send a test SMS to every active recipient. */
export async function notifyTest() {
  const phones = await recipientPhones();
  const sms = phones.length
    ? await sendSms(
        phones,
        "Embassy Pharmaceutical: test alert. If you received this, order alerts are working."
      )
    : { ...skipped, error: "No SMS recipients." };
  return { sms, phones: phones.length };
}
