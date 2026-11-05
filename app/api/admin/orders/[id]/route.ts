import { dbConnect } from "@/app/lib/db";
import OrderModel, { ORDER_STATUSES } from "@/models/Order";
import ProductModel from "@/models/Product";
import { requireStaff } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { orderForConsole } from "@/app/lib/serialize";

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

export const dynamic = "force-dynamic";

/** Move an order along: mark paid / dispatched / collected / cancelled. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    await dbConnect();
    const { status, paidVia } = await req.json();

    if (status !== undefined && !ORDER_STATUSES.includes(status)) {
      return Response.json({ error: "Unknown status." }, { status: 400 });
    }
    if (paidVia !== undefined && !["", "cash", "transfer"].includes(paidVia)) {
      return Response.json({ error: "Unknown payment method." }, { status: 400 });
    }

    const order = await OrderModel.findById((await params).id);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

    const from = order.status;
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
