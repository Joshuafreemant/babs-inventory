import { dbConnect } from "@/app/lib/db";
import { requireStaff } from "@/app/lib/auth";
import PushSubscriptionModel from "@/models/PushSubscription";

export const dynamic = "force-dynamic";

/** Register this browser to receive order-alert push notifications. */
export async function POST(req: Request) {
  try {
    const session = await requireStaff();
    await dbConnect();
    const body = await req.json();
    const endpoint = String(body?.endpoint || "");
    const p256dh = String(body?.keys?.p256dh || "");
    const auth = String(body?.keys?.auth || "");
    const userAgent = String(body?.userAgent || "").slice(0, 200);

    if (!endpoint || !p256dh || !auth) {
      return Response.json({ error: "Incomplete push subscription." }, { status: 400 });
    }

    await PushSubscriptionModel.updateOne(
      { endpoint },
      { $set: { staffId: session.staffId, endpoint, p256dh, auth, userAgent } },
      { upsert: true }
    );

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/staff/push/subscribe", err);
    return Response.json({ error: "Could not save the subscription." }, { status: 500 });
  }
}

/** Turn off alerts on this browser. */
export async function DELETE(req: Request) {
  try {
    await requireStaff();
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const endpoint = String(body?.endpoint || "");
    if (!endpoint) return Response.json({ error: "Missing endpoint." }, { status: 400 });

    await PushSubscriptionModel.deleteOne({ endpoint });
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/staff/push/subscribe", err);
    return Response.json({ error: "Could not remove the subscription." }, { status: 500 });
  }
}
