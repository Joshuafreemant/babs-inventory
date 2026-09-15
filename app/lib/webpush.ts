/**
 * Web Push — order alerts to signed-in staff who've enabled notifications on
 * their own browser/device. Separate from the SMS/email AlertRecipients list:
 * this only ever reaches staff accounts, and only devices they've opted in on.
 */
import webpush from "web-push";
import { dbConnect } from "./db";
import PushSubscriptionModel from "@/models/PushSubscription";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:orders@embassy.ng";

export function pushConfigured() {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY);
}

let configured = false;
function ensureConfigured() {
  if (configured || !pushConfigured()) return;
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Push a notification to every staff device that's enabled alerts. Never throws. */
export async function sendPushToAllStaff(payload: PushPayload) {
  if (!pushConfigured()) return { ok: false as const, skipped: true as const };
  ensureConfigured();

  try {
    await dbConnect();
    const subs = await PushSubscriptionModel.find({}).lean();
    if (subs.length === 0) return { ok: true as const, sent: 0, failed: 0 };

    const results = await Promise.allSettled(
      subs.map((s: any) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload)
        ).catch((err) => {
          // 404/410 = the browser dropped this subscription — stop trying it
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            PushSubscriptionModel.deleteOne({ _id: s._id }).catch(() => {});
          }
          throw err;
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return { ok: true as const, sent, failed: results.length - sent };
  } catch (err) {
    console.error("[webpush] sendPushToAllStaff failed", err);
    return { ok: false as const, error: (err as Error).message };
  }
}
