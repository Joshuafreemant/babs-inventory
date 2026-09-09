import { dbConnect } from "@/app/lib/db";
import OrderModel from "@/models/Order";
import { requireStaff } from "@/app/lib/auth";
import { orderForConsole } from "@/app/lib/serialize";

export const dynamic = "force-dynamic";

const OPEN_STATUSES = ["reserved", "awaiting_transfer"];

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

/** Order feed — paginated newest-first with an `_id` cursor. Stats on page 1. */
export async function GET(req: Request) {
  try {
    await requireStaff();
    await dbConnect();

    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const cursor = url.searchParams.get("cursor");

    const filter: any = {};
    if (cursor) filter._id = { $lt: cursor };

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
