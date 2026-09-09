import { dbConnect } from "@/app/lib/db";
import AlertRecipientModel from "@/models/AlertRecipient";
import { requireStaff } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { normalizePhone } from "@/app/lib/phone";
import { recipientForConsole as serialize } from "@/app/lib/serialize";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Toggle active, or edit name / phone / email. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    await dbConnect();
    const b = await req.json();

    const r = await AlertRecipientModel.findById((await params).id);
    if (!r) return Response.json({ error: "Recipient not found." }, { status: 404 });

    const changed: string[] = [];
    if (typeof b.active === "boolean") {
      r.active = b.active;
      changed.push(b.active ? "on" : "off");
    }
    if (typeof b.name === "string" && b.name.trim()) {
      r.name = b.name.trim();
      changed.push("name");
    }
    if (b.phone !== undefined) {
      const p = String(b.phone).trim();
      if (p && !normalizePhone(p))
        return Response.json({ error: "Invalid phone number." }, { status: 400 });
      r.phone = p ? normalizePhone(p)! : "";
      changed.push("phone");
    }
    if (b.email !== undefined) {
      const e = String(b.email).trim().toLowerCase();
      if (e && !EMAIL_RE.test(e))
        return Response.json({ error: "Invalid email address." }, { status: 400 });
      r.email = e;
      changed.push("email");
    }
    if (!r.phone && !r.email) {
      return Response.json({ error: "A recipient needs a phone or an email." }, { status: 400 });
    }

    await r.save();
    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "alert.recipient.edit",
      target: r.name,
      detail: changed.join(", "),
    });

    return Response.json(serialize(r));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PATCH /api/admin/alert-recipients/[id]", err);
    return Response.json({ error: "Could not update the recipient." }, { status: 500 });
  }
}

/** Remove a recipient. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    await dbConnect();
    const r = await AlertRecipientModel.findByIdAndDelete((await params).id);
    if (!r) return Response.json({ error: "Recipient not found." }, { status: 404 });

    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "alert.recipient.remove",
      target: r.name,
      detail: [r.phone, r.email].filter(Boolean).join(" / "),
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/admin/alert-recipients/[id]", err);
    return Response.json({ error: "Could not remove the recipient." }, { status: 500 });
  }
}
