import { dbConnect } from "@/app/lib/db";
import OrderModel from "@/models/Order";
import { STATUS_LABEL } from "@/app/lib/money";

export const dynamic = "force-dynamic";

/** "emb-35" / "EMB 0035" / "emb0035" -> "EMB-0035" */
function normalizeCode(raw: string): string | null {
  const m = raw.trim().match(/^([a-z]{2,5})[\s-]?(\d+)$/i);
  return m ? `${m[1].toUpperCase()}-${m[2].padStart(4, "0")}` : null;
}

/**
 * Look up orders.
 *   ?code=EMB-0035   -> that single order
 *   ?phone=0817...   -> every order placed with that phone number
 */
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const rawCode = sp.get("code")?.trim();
    const phone = sp.get("phone")?.trim();

    let filter: Record<string, string>;
    if (rawCode) {
      const code = normalizeCode(rawCode);
      if (!code) return Response.json([]);
      filter = { code };
    } else if (phone) {
      filter = { phone };
    } else {
      return Response.json([]);
    }

    await dbConnect();
    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return Response.json(
      orders.map((o: any) => ({
        code: o.code,
        items: o.items.map((i: any) => ({
          name: i.name,
          qty: i.qty,
          sellUnit: i.sellUnit || "box",
          boxesPerCarton: i.boxesPerCarton || 1,
          packetsPerBox: i.packetsPerBox,
        })),
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