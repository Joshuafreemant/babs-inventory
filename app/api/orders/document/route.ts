import { dbConnect } from "@/app/lib/db";
import OrderModel from "@/models/Order";

export const dynamic = "force-dynamic";

const maskPhone = (p: string) => (p && p.length >= 8 ? `${p.slice(0, 4)}****${p.slice(-3)}` : "****");
const maskEmail = (e: string) => {
  const [user, domain] = (e || "").split("@");
  return user && domain ? `${user[0]}***@${domain}` : "";
};

/**
 * Full order details for building an invoice / receipt.
 *   ?code=EMB-0035&phone=0817...  -> phone must match; full contact details returned
 *   ?code=EMB-0035                -> allowed, but phone and email come back masked
 * (order codes are sequential, so an unverified request must not expose contact details)
 */
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const code = sp.get("code")?.trim();
    const phone = sp.get("phone")?.trim();

    if (!code) {
      return Response.json({ error: "Order code is required." }, { status: 400 });
    }

    await dbConnect();
    const o: any = await OrderModel.findOne(phone ? { code, phone } : { code }).lean();
    if (!o) return Response.json({ error: "Order not found." }, { status: 404 });

    const verified = Boolean(phone);

    return Response.json({
      code: o.code,
      customerName: o.customerName,
      phone: verified ? o.phone : maskPhone(o.phone),
      email: verified ? o.email || "" : maskEmail(o.email),
      items: o.items.map((i: any) => ({
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        sellUnit: i.sellUnit || "box",
        boxesPerCarton: i.boxesPerCarton || 1,
        packetsPerBox: i.packetsPerBox,
      })),
      total: o.total,
      method: o.method,
      status: o.status,
      issuedByName: o.issuedByName || "",
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    });
  } catch (err) {
    console.error("GET /api/orders/document", err);
    return Response.json({ error: "Could not load order." }, { status: 500 });
  }
}