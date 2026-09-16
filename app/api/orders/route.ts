import { dbConnect } from "@/app/lib/db";
import ProductModel from "@/models/Product";
import OrderModel from "@/models/Order";
import { nextSeq } from "@/models/Counter";
import { METHOD_LABEL } from "@/app/lib/money";
import { notifyNewOrder } from "@/app/lib/notify";
import { writeAudit } from "@/models/AuditLog";
import StaffModel from "@/models/Staff";

export const dynamic = "force-dynamic";

interface IncomingItem {
  productId: string;
  qty: number;
}

/** Place an order. Prices and stock are authoritative on the server. */
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { customerName, phone, email, method } = body || {};
    const rawItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];

    if (!customerName?.trim() || !phone?.trim()) {
      return Response.json(
        { error: "Enter your pharmacy or hospital name and phone number." },
        { status: 400 }
      );
    }
    if (method !== "stand" && method !== "transfer") {
      return Response.json({ error: "Choose a payment method." }, { status: 400 });
    }
    const wanted = rawItems
      .map((i) => ({ productId: String(i.productId), qty: Math.floor(Number(i.qty)) }))
      .filter((i) => i.productId && i.qty > 0);
    if (wanted.length === 0) {
      return Response.json({ error: "Your order is empty." }, { status: 400 });
    }

    const products = await ProductModel.find({
      _id: { $in: wanted.map((w) => w.productId) },
    });
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const items = [];
    let total = 0;
    let hasBackorder = false;

    for (const w of wanted) {
      const p = byId.get(w.productId);
      if (!p) {
        return Response.json({ error: "One of the products is no longer available." }, { status: 400 });
      }
      const backordered = p.stock === 0 && p.backorder;
      if (p.stock < w.qty && !p.backorder) {
        return Response.json(
          { error: `Only ${p.stock} box${p.stock === 1 ? "" : "es"} of ${p.name} left.` },
          { status: 409 }
        );
      }
      const lineTotal = p.price * w.qty;
      total += lineTotal;
      if (backordered) hasBackorder = true;
      items.push({
        product: p._id,
        name: p.name,
        qty: w.qty,
        unitPrice: p.price,
        lineTotal,
        backordered,
        boxesPerCarton: p.boxesPerCarton,
      });
    }

    // decrement stock (floor at 0 for backorder items)
    for (const w of wanted) {
      const p = byId.get(w.productId)!;
      p.stock = Math.max(0, p.stock - w.qty);
      await p.save();
    }

    // only trust a ref that matches a real staff member
    let refSource = "";
    const rawRef = String(body?.ref || "").toLowerCase().trim();
    if (rawRef) {
      const rep = await StaffModel.findOne({ staffId: rawRef }).select("_id").lean();
      if (rep) refSource = rawRef;
    }

    const seq = await nextSeq("order");
    const code = "EMB-" + String(seq).padStart(4, "0");

    const order = await OrderModel.create({
      code,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: (email || "").trim(),
      items,
      total,
      method,
      status: method === "transfer" ? "awaiting_transfer" : "reserved",
      hasBackorder,
      refSource,
    });

    // fire-and-forget admin alerts (SMS + push) — never blocks the order
    const boxes = items.reduce((s, i) => s + i.qty, 0);
    const refName = refSource
      ? (await StaffModel.findOne({ staffId: refSource }).select("name").lean())?.name || refSource
      : undefined;

    notifyNewOrder({
      code,
      customerName: order.customerName,
      phone: order.phone,
      items: items.map((i) => ({ name: i.name, qty: i.qty, lineTotal: i.lineTotal })),
      boxes,
      total,
      methodLabel: METHOD_LABEL[method],
      hasBackorder,
      refName,
    })
      .then((r) => {
        const fails: string[] = [];
        if (!r.sms.ok && !r.sms.skipped) fails.push(`SMS: ${r.sms.error || "failed"}`);
        if (!r.push.ok && !r.push.skipped) fails.push(`Push: ${r.push.error || "failed"}`);
        if (fails.length) {
          writeAudit({
            staffId: "system",
            staffName: "System",
            action: "alert.failed",
            target: code,
            detail: fails.join(" · "),
          });
        }
      })
      .catch((e) => console.error("order alert failed", e));

    return Response.json({
      id: String(order._id),
      code: order.code,
      total: order.total,
      method: order.method,
      methodLabel: METHOD_LABEL[method],
      hasBackorder,
    });
  } catch (err) {
    console.error("POST /api/orders", err);
    return Response.json({ error: "Could not place the order. Please try again." }, { status: 500 });
  }
}
