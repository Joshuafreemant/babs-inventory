import { dbConnect } from "@/app/lib/db";
import StaffModel from "@/models/Staff";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { staffForConsole } from "@/app/lib/serialize";

export const dynamic = "force-dynamic";

/**
 * Update a staff account. Admins only.
 *  { active?, role?, passcode? } — pass only what changed.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    await dbConnect();
    const b = await req.json();
    const { id } = await params;

    const staff = await StaffModel.findById(id);
    if (!staff) return Response.json({ error: "Staff member not found." }, { status: 404 });

    const isSelf = String(staff._id) === admin.id;
    const changed: string[] = [];

    if (typeof b.active === "boolean") {
      if (isSelf && !b.active)
        return Response.json({ error: "You can't deactivate your own account." }, { status: 400 });
      staff.active = b.active;
      changed.push(`active=${b.active}`);
    }
    if (b.role === "admin" || b.role === "rep") {
      if (isSelf && b.role !== "admin")
        return Response.json({ error: "You can't remove your own admin access." }, { status: 400 });
      staff.role = b.role;
      changed.push(`role=${b.role}`);
    }
    if (typeof b.passcode === "string" && b.passcode) {
      if (b.passcode.length < 4)
        return Response.json({ error: "Passcode must be at least 4 characters." }, { status: 400 });
      staff.passwordHash = bcrypt.hashSync(b.passcode, 10);
      changed.push("passcode reset");
    }

    if (changed.length === 0) return Response.json({ error: "Nothing to change." }, { status: 400 });

    await staff.save();
    await writeAudit({
      staffId: admin.staffId,
      staffName: admin.name,
      action: "staff.edit",
      target: staff.staffId,
      detail: changed.join(", "),
    });

    return Response.json(staffForConsole(staff));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PATCH /api/admin/staff/[id]", err);
    return Response.json({ error: "Could not update staff." }, { status: 500 });
  }
}
