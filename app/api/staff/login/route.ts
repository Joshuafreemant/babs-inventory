import { dbConnect } from "@/app/lib/db";
import StaffModel from "@/models/Staff";
import bcrypt from "bcryptjs";
import { signStaffToken, setStaffCookie } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { staffId, passcode } = await req.json();

    if (!staffId?.trim() || !passcode) {
      return Response.json({ error: "Enter your staff ID and passcode." }, { status: 400 });
    }

    const staff = await StaffModel.findOne({ staffId: staffId.toLowerCase().trim() });
    if (!staff || !staff.active) {
      return Response.json({ error: "Staff ID or passcode incorrect." }, { status: 401 });
    }
    const ok = bcrypt.compareSync(passcode, staff.passwordHash);
    if (!ok) {
      return Response.json({ error: "Staff ID or passcode incorrect." }, { status: 401 });
    }

    const session = {
      id: String(staff._id),
      name: staff.name,
      staffId: staff.staffId,
      role: staff.role,
    };
    await setStaffCookie(signStaffToken(session));
    return Response.json(session);
  } catch (err) {
    console.error("POST /api/staff/login", err);
    return Response.json({ error: "Sign-in failed. Please try again." }, { status: 500 });
  }
}
