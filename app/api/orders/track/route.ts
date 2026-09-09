import { dbConnect } from "@/app/lib/db";
import OrderModel from "@/models/Order";
import { STATUS_LABEL } from "@/app/lib/money";

export const dynamic = "force-dynamic";

/** Look up a customer's orders by the phone number they ordered with. */
export async function GET(req: Request) {
  try {
    const phone = new URL(req.url).searchParams.get("phone")?.trim();
    if (!phone) return Response.json([]);

    await dbConnect();
    const orders = await OrderModel.find({ phone })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return Response.json(
      orders.map((o: any) => ({
        code: o.code,
        items: o.items.map((i: any) => `${i.name} x${i.qty}`).join(", "),
        total: o.total,
        status: o.status,
        statusLabel: STATUS_LABEL[o.status] || o.status,
        createdAt: o.createdAt,
      }))
    );
  } catch (err) {
    console.error("GET /api/orders/track", err);
    return Response.json({ error: "Could not look up orders." }, { status: 500 });
  }
}
