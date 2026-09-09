import { requireStaff } from "@/app/lib/auth";
import { notifyTest, notifyStatus } from "@/app/lib/notify";
import { writeAudit } from "@/models/AuditLog";

export const dynamic = "force-dynamic";

/** Send a test alert (SMS + email) to every active recipient. */
export async function POST() {
  try {
    const staff = await requireStaff();
    const status = notifyStatus();

    if (!status.sms.configured && !status.email.configured) {
      return Response.json(
        { error: "Neither SMS nor email is set up yet — add the keys to .env and restart." },
        { status: 400 }
      );
    }

    const r = await notifyTest();

    if (r.phones === 0 && r.emails === 0) {
      return Response.json({ error: "Add at least one active recipient first." }, { status: 400 });
    }

    const parts: string[] = [];
    if (r.phones > 0) {
      parts.push(
        r.sms.ok
          ? `SMS sent to ${r.sms.sent ?? r.phones}`
          : r.sms.skipped
            ? `SMS skipped (${status.sms.provider} not configured)`
            : `SMS failed: ${r.sms.error || "unknown"}`
      );
    }
    if (r.emails > 0) {
      parts.push(
        r.email.ok
          ? `Email sent to ${r.email.sent ?? r.emails}`
          : r.email.skipped
            ? "Email skipped (Resend not configured)"
            : `Email failed: ${r.email.error || "unknown"}`
      );
    }

    const anyFailed =
      (r.phones > 0 && !r.sms.ok && !r.sms.skipped) ||
      (r.emails > 0 && !r.email.ok && !r.email.skipped);

    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "alert.test",
      target: `${r.phones} phone / ${r.emails} email`,
      detail: parts.join(" · "),
    });

    return Response.json(
      { ok: !anyFailed, message: parts.join(" · ") },
      { status: anyFailed ? 502 : 200 }
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/admin/alert-recipients/test", err);
    return Response.json({ error: "Could not send the test alert." }, { status: 500 });
  }
}
