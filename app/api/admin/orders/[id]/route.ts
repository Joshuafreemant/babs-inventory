import { dbConnect } from "@/app/lib/db";
import OrderModel, { ORDER_STATUSES } from "@/models/Order";
import { requireStaff } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { orderForConsole } from "@/app/lib/serialize";

export const dynamic = "force-dynamic";

/** Move an order along: mark paid / dispatched / collected / cancelled. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    await dbConnect();
    const { status } = await req.json();

    if (!ORDER_STATUSES.includes(status)) {
      return Response.json({ error: "Unknown status." }, { status: 400 });
    }

    const order = await OrderModel.findById((await params).id);
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

    const from = order.status;
    order.status = status;
    await order.save();

    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "order.status",
      target: order.code,
      detail: `${from} -> ${status}`,
    });

    return Response.json(orderForConsole(order));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PATCH /api/admin/orders/[id]", err);
    return Response.json({ error: "Could not update the order." }, { status: 500 });
  }
}
