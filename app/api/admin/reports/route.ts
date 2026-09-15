import { dbConnect } from "@/app/lib/db";
import OrderModel from "@/models/Order";
import StaffModel from "@/models/Staff";
import { requireStaff } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}
function mondayOf(d: Date) {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - day);
  return x;
}

// realised sales — money has actually changed hands
const PAID = ["paid", "dispatched", "collected"];
const UNPAID = ["reserved", "awaiting_transfer"];

/**
 * Sales report.
 *  `?range=7d|90d|mtd|all` (default 30d) or `?from=&to=` for a custom window.
 *  `?basis=paid` (default) counts only orders marked paid / dispatched / collected;
 *  `?basis=all` counts every non-cancelled order (reservations included).
 *  `?cursor=&limit=` cursor-paginate the "sales by product" list only — every
 *  other field in the response (totals, series, etc.) always reflects the
 *  whole range, unaffected by these two.
 */
export async function GET(req: Request) {
  try {
    await requireStaff();
    await dbConnect();

    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "30d";
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const basis = url.searchParams.get("basis") === "all" ? "all" : "paid";
    const productCursor = url.searchParams.get("cursor");
    const productLimit = Math.min(
      2000,
      Math.max(5, parseInt(url.searchParams.get("limit") || "10", 10))
    );

    const now = new Date();
    let from: Date;
    let to = now;
    let label: string;

    if (fromParam && toParam) {
      from = startOfDay(new Date(fromParam));
      to = new Date(new Date(toParam).setHours(23, 59, 59, 999));
      label = `${ymd(from)} → ${ymd(to)}`;
    } else if (range === "7d") {
      from = startOfDay(new Date(now.getTime() - 6 * DAY));
      label = "Last 7 days";
    } else if (range === "90d") {
      from = startOfDay(new Date(now.getTime() - 89 * DAY));
      label = "Last 90 days";
    } else if (range === "mtd") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      label = "This month";
    } else if (range === "all") {
      const first = await OrderModel.findOne({
        status: basis === "all" ? { $ne: "cancelled" } : { $in: PAID },
      })
        .sort({ createdAt: 1 })
        .select("createdAt")
        .lean();
      from = first ? startOfDay(new Date((first as any).createdAt)) : startOfDay(now);
      label = "All time";
    } else {
      from = startOfDay(new Date(now.getTime() - 29 * DAY));
      label = "Last 30 days";
    }

    const window = { createdAt: { $gte: from, $lte: to } };
    const statusMatch = basis === "all" ? { $ne: "cancelled" } : { $in: PAID };

    const orders = await OrderModel.find({ ...window, status: statusMatch })
      .select("items total method status createdAt refSource")
      .lean();

    // reserved / awaiting-payment sitting in the pipeline for this window
    const pipelineAgg = await OrderModel.aggregate([
      { $match: { ...window, status: { $in: UNPAID } } },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$total" } } },
    ]);
    const pipeline = { orders: pipelineAgg[0]?.orders || 0, revenue: pipelineAgg[0]?.revenue || 0 };

    // ---- totals ----
    let revenue = 0;
    let boxes = 0;
    let collectedRevenue = 0;
    let outstandingRevenue = 0;
    const byMethod: Record<string, { orders: number; revenue: number }> = {
      stand: { orders: 0, revenue: 0 },
      transfer: { orders: 0, revenue: 0 },
    };
    const byStatus: Record<string, number> = {};

    const productMap = new Map<
      string,
      { name: string; boxes: number; revenue: number; orders: Set<string> }
    >();
    const sourceMap = new Map<string, { orders: number; revenue: number; boxes: number }>();

    const spanDays = Math.round((to.getTime() - from.getTime()) / DAY) + 1;
    const weekly = spanDays > 62;
    const buckets = new Map<string, { revenue: number; orders: number }>();

    for (const o of orders as any[]) {
      revenue += o.total;
      collectedRevenue += PAID.includes(o.status) ? o.total : 0;
      outstandingRevenue += UNPAID.includes(o.status) ? o.total : 0;
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      if (byMethod[o.method]) {
        byMethod[o.method].orders += 1;
        byMethod[o.method].revenue += o.total;
      }

      const key = weekly
        ? ymd(mondayOf(new Date(o.createdAt)))
        : ymd(startOfDay(new Date(o.createdAt)));
      const b = buckets.get(key) || { revenue: 0, orders: 0 };
      b.revenue += o.total;
      b.orders += 1;
      buckets.set(key, b);

      const src = o.refSource || "";
      const s = sourceMap.get(src) || { orders: 0, revenue: 0, boxes: 0 };
      s.orders += 1;
      s.revenue += o.total;

      for (const it of o.items) {
        boxes += it.qty;
        s.boxes += it.qty;
        const pid = String(it.product);
        const entry =
          productMap.get(pid) ||
          { name: it.name, boxes: 0, revenue: 0, orders: new Set<string>() };
        entry.boxes += it.qty;
        entry.revenue += it.lineTotal;
        entry.orders.add(String(o._id));
        productMap.set(pid, entry);
      }
      sourceMap.set(src, s);
    }

    const orderCount = orders.length;

    // ---- sales by referral source (which rep's shared link) ----
    const staffIds = Array.from(sourceMap.keys()).filter(Boolean);
    const staff = staffIds.length
      ? await StaffModel.find({ staffId: { $in: staffIds } }).select("staffId name").lean()
      : [];
    const staffName = new Map(staff.map((s: any) => [s.staffId, s.name]));
    const bySource = Array.from(sourceMap.entries())
      .map(([source, v]) => ({
        source: source || "direct",
        name: source ? staffName.get(source) || source : "Direct / walk-in",
        orders: v.orders,
        boxes: v.boxes,
        revenue: v.revenue,
        sharePct: revenue > 0 ? +((v.revenue / revenue) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ---- per-product, sorted by revenue (productId as a stable tiebreaker
    // so the cursor never skips or repeats a row when revenue ties) ----
    const perProductAll = Array.from(productMap.entries())
      .map(([productId, e]) => ({
        productId,
        name: e.name,
        boxes: e.boxes,
        revenue: e.revenue,
        orders: e.orders.size,
        sharePct: revenue > 0 ? +((e.revenue / revenue) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue || a.productId.localeCompare(b.productId));

    let productStart = 0;
    if (productCursor) {
      const idx = perProductAll.findIndex((p) => p.productId === productCursor);
      productStart = idx >= 0 ? idx + 1 : 0;
    }
    const perProduct = perProductAll.slice(productStart, productStart + productLimit);
    const productHasMore = productStart + productLimit < perProductAll.length;
    const productNextCursor = productHasMore ? perProduct[perProduct.length - 1].productId : null;

    // ---- fill every bucket in the window ----
    const series: { date: string; revenue: number; orders: number }[] = [];
    let cursor = weekly ? mondayOf(from) : startOfDay(from);
    const step = weekly ? 7 * DAY : DAY;
    while (cursor.getTime() <= to.getTime()) {
      const key = ymd(cursor);
      const b = buckets.get(key) || { revenue: 0, orders: 0 };
      series.push({ date: key, revenue: b.revenue, orders: b.orders });
      cursor = new Date(cursor.getTime() + step);
    }

    return Response.json({
      range: { from: ymd(from), to: ymd(to), label, bucket: weekly ? "week" : "day", basis },
      totals: {
        revenue,
        orders: orderCount,
        boxes,
        avgOrderValue: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
        collectedRevenue,
        outstandingRevenue,
      },
      pipeline,
      byMethod,
      byStatus,
      bySource,
      perProduct,
      perProductTotal: perProductAll.length,
      nextCursor: productNextCursor,
      hasMore: productHasMore,
      series,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/admin/reports", err);
    return Response.json({ error: "Could not build the report." }, { status: 500 });
  }
}
