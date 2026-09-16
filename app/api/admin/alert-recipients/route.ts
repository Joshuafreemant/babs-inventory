import { dbConnect } from "@/app/lib/db";
import AlertRecipientModel from "@/models/AlertRecipient";
import { requireStaff } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { normalizePhone } from "@/app/lib/phone";
import { notifyStatus } from "@/app/lib/notify";
import { recipientForConsole as serialize } from "@/app/lib/serialize";

export const dynamic = "force-dynamic";

/** List recipients + whether SMS is wired up. */
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

/** Add a recipient — needs a name and a phone number. */
export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    await dbConnect();
    const { name, phone } = await req.json();

    if (!name?.trim()) return Response.json({ error: "Give the recipient a name." }, { status: 400 });

    const normalizedPhone = normalizePhone(String(phone || ""));
    if (!normalizedPhone) {
      return Response.json({ error: "That doesn't look like a valid phone number." }, { status: 400 });
    }

    const clash = await AlertRecipientModel.findOne({ phone: normalizedPhone });
    if (clash) return Response.json({ error: "That phone number is already on the list." }, { status: 409 });

    const recipient = await AlertRecipientModel.create({
      name: name.trim(),
      phone: normalizedPhone,
      active: true,
      addedBy: staff.staffId,
    });

    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "alert.recipient.add",
      target: name.trim(),
      detail: normalizedPhone,
    });

    return Response.json(serialize(recipient));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/admin/alert-recipients", err);
    return Response.json({ error: "Could not add the recipient." }, { status: 500 });
  }
}
