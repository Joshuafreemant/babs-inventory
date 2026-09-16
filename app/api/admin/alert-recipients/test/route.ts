import { requireStaff } from "@/app/lib/auth";
import { notifyTest, notifyStatus } from "@/app/lib/notify";
import { writeAudit } from "@/models/AuditLog";

export const dynamic = "force-dynamic";

/** Send a test SMS to every active recipient. */
export async function POST() {
  try {
    const staff = await requireStaff();
    const status = notifyStatus();

    if (!status.sms.configured) {
      return Response.json(
        { error: "SMS isn't set up yet — add the provider keys to .env and restart." },
        { status: 400 }
      );
    }

    const r = await notifyTest();

    if (r.phones === 0) {
      return Response.json({ error: "Add at least one active recipient first." }, { status: 400 });
    }

    const message = r.sms.ok
      ? `SMS sent to ${r.sms.sent ?? r.phones}`
      : r.sms.skipped
        ? `SMS skipped (${status.sms.provider} not configured)`
        : `SMS failed: ${r.sms.error || "unknown"}`;

    const failed = !r.sms.ok && !r.sms.skipped;

    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "alert.test",
      target: `${r.phones} phone`,
      detail: message,
    });

    return Response.json({ ok: !failed, message }, { status: failed ? 502 : 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/admin/alert-recipients/test", err);
    return Response.json({ error: "Could not send the test alert." }, { status: 500 });
  }
}
