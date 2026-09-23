import { dbConnect } from "@/app/lib/db";
import { requireStaff } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";

export const dynamic = "force-dynamic";

/** Client couldn't enable push alerts on this device (permission denied, the
 * browser's push service rejected it, etc). Logged so admins can see how
 * often devices fail to opt in — SMS alerts still cover those staff either
 * way, this is just for visibility. */
export async function POST(req: Request) {
  try {
    const session = await requireStaff();
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const reason = String(body?.reason || "other").slice(0, 40);
    const message = String(body?.message || "").slice(0, 200);
    const userAgent = String(body?.userAgent || "").slice(0, 200);

    await writeAudit({
      staffId: session.staffId,
      staffName: session.name,
      action: "push.subscribe_failed",
      target: "",
      detail: [reason, message, userAgent].filter(Boolean).join(" · "),
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/staff/push/subscribe-failed", err);
    return Response.json({ error: "Could not log the failure." }, { status: 500 });
  }
}
