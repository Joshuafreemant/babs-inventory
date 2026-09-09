import { dbConnect } from "@/app/lib/db";
import AlertRecipientModel from "@/models/AlertRecipient";
import { requireStaff } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { normalizePhone } from "@/app/lib/phone";
import { notifyStatus } from "@/app/lib/notify";
import { recipientForConsole as serialize } from "@/app/lib/serialize";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** List recipients + whether SMS and email are wired up. */
export async function GET() {
  try {
    await requireStaff();
    await dbConnect();
    const recipients = await AlertRecipientModel.find({}).sort({ createdAt: 1 }).lean();
    return Response.json({ recipients: recipients.map(serialize), ...notifyStatus() });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/admin/alert-recipients", err);
    return Response.json({ error: "Could not load recipients." }, { status: 500 });
  }
}

/** Add a recipient — needs a name and at least one of phone / email. */
export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    await dbConnect();
    const { name, phone, email } = await req.json();

    if (!name?.trim()) return Response.json({ error: "Give the recipient a name." }, { status: 400 });

    let normalizedPhone = "";
    if (String(phone || "").trim()) {
      const n = normalizePhone(String(phone));
      if (!n)
        return Response.json({ error: "That doesn't look like a valid phone number." }, { status: 400 });
      normalizedPhone = n;
    }

    let normalizedEmail = "";
    if (String(email || "").trim()) {
      const e = String(email).trim().toLowerCase();
      if (!EMAIL_RE.test(e))
        return Response.json({ error: "That doesn't look like a valid email address." }, { status: 400 });
      normalizedEmail = e;
    }

    if (!normalizedPhone && !normalizedEmail) {
      return Response.json({ error: "Add a phone number, an email, or both." }, { status: 400 });
    }

    const clash = await AlertRecipientModel.findOne({
      $or: [
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ],
    });
    if (clash)
      return Response.json({ error: "That phone or email is already on the list." }, { status: 409 });

    const recipient = await AlertRecipientModel.create({
      name: name.trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      active: true,
      addedBy: staff.staffId,
    });

    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "alert.recipient.add",
      target: name.trim(),
      detail: [normalizedPhone, normalizedEmail].filter(Boolean).join(" / "),
    });

    return Response.json(serialize(recipient));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/admin/alert-recipients", err);
    return Response.json({ error: "Could not add the recipient." }, { status: 500 });
  }
}
