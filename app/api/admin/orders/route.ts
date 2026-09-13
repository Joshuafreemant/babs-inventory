import { dbConnect } from "@/app/lib/db";
import OrderModel, { ORDER_STATUSES } from "@/models/Order";
import { requireStaff } from "@/app/lib/auth";
import { orderForConsole } from "@/app/lib/serialize";

export const dynamic = "force-dynamic";

const OPEN_STATUSES = ["reserved", "awaiting_transfer"];
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function headlineStats() {
  return {
    ordersTotal: await OrderModel.countDocuments({}),
    reservedAtStand: await OrderModel.countDocuments({ status: "reserved" }),
    awaitingTransferAmount:
      (
        await OrderModel.aggregate([
          { $match: { status: "awaiting_transfer" } },
          { $group: { _id: null, sum: { $sum: "$total" } } },
        ])
      )[0]?.sum || 0,
    outstandingAmount:
      (
        await OrderModel.aggregate([
          { $match: { status: { $in: OPEN_STATUSES } } },
          { $group: { _id: null, sum: { $sum: "$total" } } },
        ])
      )[0]?.sum || 0,
  };
}

/**
 * Order feed — paginated newest-first with an `_id` cursor. Stats on page 1
 * (always over ALL orders, unaffected by the filters below).
 *   ?status=<one of ORDER_STATUSES>   narrow to one status
 *   ?q=<text>                        match order code (e.g. "EMB-0007") or phone,
 *                                     digits-only comparison for phone so any
 *                                     formatting the rep types still matches
 */
export async function GET(req: Request) {
  try {
    await requireStaff();
    await dbConnect();

    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const cursor = url.searchParams.get("cursor");
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q")?.trim();

    const filter: any = {};
    if (cursor) filter._id = { $lt: cursor };
    if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }
    if (q) {
      const digits = q.replace(/\D/g, "");
      const or: any[] = [{ code: new RegExp(escapeRe(q), "i") }];
      if (digits) or.push({ phone: new RegExp(escapeRe(digits)) });
      filter.$or = or;
    }

    const docs = await OrderModel.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const page = hasMore ? docs.slice(0, limit) : docs;

    return Response.json({
      orders: page.map(orderForConsole),
      nextCursor: hasMore ? String(page[page.length - 1]._id) : null,
      hasMore,
      stats: cursor ? undefined : await headlineStats(),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/admin/orders", err);
    return Response.json({ error: "Could not load orders." }, { status: 500 });
  }
}
