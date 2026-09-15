/**
 * Order alerts — one place that fans a new order out to every active recipient
 * over whichever channels they've given us (SMS phone, email, or both).
 */
import { dbConnect } from "./db";
import AlertRecipientModel from "@/models/AlertRecipient";
import { normalizePhone } from "./phone";
import { sendSms, smsConfigured, providerLabel, senderId, newOrderMessage } from "./sms";
import {
  sendEmail,
  emailConfigured,
  emailFrom,
  orderEmailContent,
  testEmailContent,
  OrderEmailInput,
} from "./email";
import { sendPushToAllStaff, pushConfigured } from "./webpush";
import { naira } from "./money";

function envNumbers(): string[] {
  return (process.env.ADMIN_ALERT_NUMBERS || "")
    .split(",")
    .map((n) => normalizePhone(n))
    .filter((n): n is string => Boolean(n));
}

export async function recipientChannels(): Promise<{ phones: string[]; emails: string[] }> {
  let phones: string[] = [];
  let emails: string[] = [];
  try {
    await dbConnect();
    const docs = await AlertRecipientModel.find({ active: true }).lean();
    phones = docs.map((d: any) => d.phone).filter(Boolean);
    emails = docs.map((d: any) => d.email).filter(Boolean);
  } catch (err) {
    console.error("[notify] could not read recipients", err);
  }
  return {
    phones: Array.from(new Set([...phones, ...envNumbers()])),
    emails: Array.from(new Set(emails)),
  };
}

export function notifyStatus() {
  return {
    sms: { configured: smsConfigured(), provider: providerLabel(), senderId: senderId() },
    email: { configured: emailConfigured(), from: emailFrom() },
    push: { configured: pushConfigured() },
  };
}

const skipped = { ok: false as const, skipped: true as const };

export interface NewOrderInfo extends OrderEmailInput {
  boxes: number;
}

/** SMS + email every active recipient about a new order. Never throws. */
export async function notifyNewOrder(o: NewOrderInfo) {
  const { phones, emails } = await recipientChannels();

  const smsText = newOrderMessage({
    code: o.code,
    customerName: o.customerName,
    phone: o.phone,
    items: o.items,
    boxes: o.boxes,
    total: o.total,
    methodLabel: o.methodLabel,
  });
  const mail = orderEmailContent(o);

  const [sms, email, push] = await Promise.all([
    phones.length ? sendSms(phones, smsText) : Promise.resolve(skipped),
    emails.length ? sendEmail(emails, mail.subject, mail.html, mail.text) : Promise.resolve(skipped),
    sendPushToAllStaff({
      title: `New order · ${o.code}`,
      body: `${o.customerName} · ${o.boxes} box${o.boxes === 1 ? "" : "es"} · ${naira(o.total)}`,
      url: "/console",
    }),
  ]);
  return { sms, email, push, phones: phones.length, emails: emails.length };
}

/** Send a test SMS + test email to every active recipient. */
export async function notifyTest() {
  const { phones, emails } = await recipientChannels();
  const t = testEmailContent();
  const [sms, email] = await Promise.all([
    phones.length
      ? sendSms(
          phones,
          "Embassy Pharmaceutical: test alert. If you received this, order alerts are working."
        )
      : Promise.resolve({ ...skipped, error: "No SMS recipients." }),
    emails.length
      ? sendEmail(emails, t.subject, t.html, t.text)
      : Promise.resolve({ ...skipped, error: "No email recipients." }),
  ]);
  return { sms, email, phones: phones.length, emails: emails.length };
}
