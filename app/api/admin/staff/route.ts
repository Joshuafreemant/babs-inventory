import { dbConnect } from "@/app/lib/db";
import StaffModel from "@/models/Staff";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { staffForConsole } from "@/app/lib/serialize";

export const dynamic = "force-dynamic";

const ID_RE = /^[a-z0-9._-]{2,30}$/;

/** List staff accounts. Admins only. */
export async function GET() {
  try {
    await requireAdmin();
    await dbConnect();
    const staff = await StaffModel.find().sort({ createdAt: 1 });
    return Response.json({ staff: staff.map(staffForConsole) });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/admin/staff", err);
    return Response.json({ error: "Could not load staff." }, { status: 500 });
  }
}

/** Add a rep or admin account. Admins only. */
export async function POST(req: Request) {
  try {
    const staff = await requireAdmin();
    await dbConnect();
    const b = await req.json();

    const name = typeof b.name === "string" ? b.name.trim() : "";
    const staffId = typeof b.staffId === "string" ? b.staffId.trim().toLowerCase() : "";
    const passcode = typeof b.passcode === "string" ? b.passcode : "";
    const role = b.role === "admin" ? "admin" : "rep";

    if (!name) return Response.json({ error: "Enter their name." }, { status: 400 });
    if (!ID_RE.test(staffId))
      return Response.json(
        { error: "Staff ID must be 2-30 characters: letters, numbers, dots, dashes or underscores." },
        { status: 400 }
      );
    if (passcode.length < 4)
      return Response.json({ error: "Passcode must be at least 4 characters." }, { status: 400 });

    const clash = await StaffModel.findOne({ staffId });
    if (clash) return Response.json({ error: "That staff ID is already in use." }, { status: 409 });

    const doc = await StaffModel.create({
      name,
      staffId,
      passwordHash: bcrypt.hashSync(passcode, 10),
      role,
      active: true,
    });

    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "staff.add",
      target: staffId,
      detail: `${name} · ${role}`,
    });

    return Response.json(staffForConsole(doc));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/admin/staff", err);
    return Response.json({ error: "Could not add staff." }, { status: 500 });
  }
}
