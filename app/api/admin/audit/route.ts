import { dbConnect } from "@/app/lib/db";
import AuditLogModel from "@/models/AuditLog";
import { requireAdmin } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Activity log — who restocked, edited, removed, added a product, added a
 * rep, moved an order along, and so on. Admins only.
 *   ?cursor=&limit=   paginated newest-first, same _id-cursor pattern as
 *                     the orders/products feeds
 *   ?q=<text>         match staff name or the target (product name / order
 *                     code / staff name) — case-insensitive
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    await dbConnect();

    const url = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "30", 10)));
    const cursor = url.searchParams.get("cursor");
    const q = url.searchParams.get("q")?.trim();

    const filter: any = {};
    if (cursor) filter._id = { $lt: cursor };
    if (q) {
      const re = new RegExp(escapeRe(q), "i");
      filter.$or = [{ staffName: re }, { target: re }];
    }

    const docs = await AuditLogModel.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const page = hasMore ? docs.slice(0, limit) : docs;

    return Response.json({
      entries: page.map((e: any) => ({
        id: String(e._id),
        staffName: e.staffName,
        staffId: e.staffId,
        action: e.action,
        target: e.target,
        detail: e.detail,
        createdAt: e.createdAt,
      })),
      nextCursor: hasMore ? String(page[page.length - 1]._id) : null,
      hasMore,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/admin/audit", err);
    return Response.json({ error: "Could not load the activity log." }, { status: 500 });
  }
}
