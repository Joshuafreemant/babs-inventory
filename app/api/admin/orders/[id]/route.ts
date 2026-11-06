import { dbConnect } from "@/app/lib/db";
import OrderModel, { ORDER_STATUSES } from "@/models/Order";
import ProductModel from "@/models/Product";
import { requireStaff } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { orderForConsole } from "@/app/lib/serialize";
import { unitLabel } from "@/app/lib/money";

/** Credit (sign=1) or re-deduct (sign=-1) stock for an order's non-backordered
 * items — backordered items never actually came off the shelf, so they're
 * left alone. */
async function adjustStockForOrder(order: any, sign: 1 | -1) {
  await Promise.all(
    order.items
      .filter((i: any) => !i.backordered)
      .map((i: any) => ProductModel.findByIdAndUpdate(i.product, { $inc: { stock: sign * i.qty } }))
  );
}

interface IncomingItem {
  productId: string;
  qty: number;
}

/** Rebuild an order's items from a fresh {productId, qty}[] list, moving stock
 * by the delta against what the order currently holds. A cancelled order
 * holds no stock (it was already credited back on cancel), so edits made
 * while cancelled only rewrite the record — stock moves again if/when it's
 * reactivated, based on the edited items. */
async function rebuildOrderItems(order: any, rawItems: IncomingItem[]) {
  const wanted = rawItems
    .map((i) => ({ productId: String(i.productId), qty: Math.floor(Number(i.qty)) }))
    .filter((i) => i.productId && i.qty > 0);
  if (wanted.length === 0) throw Response.json({ error: "An order needs at least one item." }, { status: 400 });

  const holdingStock = order.status !== "cancelled";
  const heldQtyByProduct = new Map<string, number>();
  if (holdingStock) {
    for (const i of order.items) {
      if (i.backordered) continue;
      const key = String(i.product);
      heldQtyByProduct.set(key, (heldQtyByProduct.get(key) || 0) + i.qty);
    }
  }

  const products = await ProductModel.find({ _id: { $in: wanted.map((w) => w.productId) } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = [];
  let total = 0;
  let hasBackorder = false;
  const touched = new Set<string>();

  for (const w of wanted) {
    const p = byId.get(w.productId);
    if (!p) throw Response.json({ error: "One of the products is no longer available." }, { status: 400 });
    touched.add(w.productId);

    const heldQty = heldQtyByProduct.get(w.productId) || 0;
    const availableStock = p.stock + heldQty; // credit this order's current hold back first
    const backordered = availableStock < w.qty && p.backorder;
    if (availableStock < w.qty && !p.backorder) {
      throw Response.json(
        { error: `Only ${availableStock} ${unitLabel(p.sellUnit, availableStock)} of ${p.name} left.` },
        { status: 409 }
      );
    }
    // a cancelled order holds no stock, so editing its items while cancelled
    // only rewrites the record — stock isn't touched until it's reactivated
    if (holdingStock) {
      const newHeldQty = backordered ? 0 : w.qty;
      p.stock = Math.max(0, availableStock - newHeldQty);
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
      sellUnit: p.sellUnit || "box",
      packetsPerBox: p.packetsPerBox,
    });
  }

  // items dropped entirely from the order give their whole held qty back
  for (const [productId, heldQty] of heldQtyByProduct) {
    if (touched.has(productId) || heldQty === 0) continue;
    const p = await ProductModel.findById(productId);
    if (p) {
      p.stock = p.stock + heldQty;
      await p.save();
    }
  }
  await Promise.all(wanted.map((w) => byId.get(w.productId)!.save()));

  order.items = items;
  order.total = total;
  order.hasBackorder = hasBackorder;
}

export const dynamic = "force-dynamic";

/** Move an order along: mark paid / dispatched / collected / cancelled;
 * edit its items; change how it was paid. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    await dbConnect();
    const { status, paidVia, items } = await req.json();

    if (status !== undefined && !ORDER_STATUSES.includes(status)) {
      return Response.json({ error: "Unknown status." }, { status: 400 });
    }
    if (paidVia !== undefined && !["", "cash", "transfer"].includes(paidVia)) {
      return Response.json({ error: "Unknown payment method." }, { status: 400 });
    }
    if (items !== undefined && !Array.isArray(items)) {
      return Response.json({ error: "Invalid items." }, { status: 400 });
    }

    const order = await OrderModel.findById((await params).id);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

    const from = order.status;
    const prevItemsSummary = items !== undefined ? order.items.map((i: any) => `${i.name} x${i.qty}`).join(", ") : "";

    if (items !== undefined) {
      await rebuildOrderItems(order, items);
    }
    if (status !== undefined) {
      order.status = status;
      // Stamp the invoice's "issued by" the first time an order is marked paid;
      // later status changes (dispatched/collected/cancelled) don't overwrite it.
      if (status === "paid" && !order.issuedByName) {
        order.issuedByStaffId = staff.staffId;
        order.issuedByName = staff.name;
      }
    }
    if (paidVia !== undefined) order.paidVia = paidVia;
    await order.save();

    // cancelling frees up the stock it held; reactivating a cancelled order
    // takes it back out again
    if (status === "cancelled" && from !== "cancelled") {
      await adjustStockForOrder(order, 1);
    } else if (from === "cancelled" && status !== undefined && status !== "cancelled") {
      await adjustStockForOrder(order, -1);
    }

    if (items !== undefined) {
      await writeAudit({
        staffId: staff.staffId,
        staffName: staff.name,
        action: "order.items",
        target: order.code,
        detail: `${prevItemsSummary} -> ${order.items.map((i: any) => `${i.name} x${i.qty}`).join(", ")}`,
      });
    }
    if (status !== undefined) {
      await writeAudit({
        staffId: staff.staffId,
        staffName: staff.name,
        action: "order.status",
        target: order.code,
        detail: `${from} -> ${status}`,
      });
    }
    if (paidVia !== undefined) {
      await writeAudit({
        staffId: staff.staffId,
        staffName: staff.name,
        action: "order.paidVia",
        target: order.code,
        detail: paidVia || "(cleared)",
      });
    }

    return Response.json(orderForConsole(order));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PATCH /api/admin/orders/[id]", err);
    return Response.json({ error: "Could not update the order." }, { status: 500 });
  }
}
