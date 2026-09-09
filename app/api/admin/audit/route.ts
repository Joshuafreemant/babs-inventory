import { dbConnect } from "@/app/lib/db";
import AuditLogModel from "@/models/AuditLog";
import { requireStaff } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

/** Recent activity — who changed stock, who moved orders along. */
export async function GET() {
  try {
    await requireStaff();
    await dbConnect();
    const entries = await AuditLogModel.find({}).sort({ createdAt: -1 }).limit(100).lean();
    return Response.json(
      entries.map((e: any) => ({
        staffName: e.staffName,
        staffId: e.staffId,
        action: e.action,
        target: e.target,
        detail: e.detail,
        createdAt: e.createdAt,
      }))
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/admin/audit", err);
    return Response.json({ error: "Could not load the audit log." }, { status: 500 });
  }
}
