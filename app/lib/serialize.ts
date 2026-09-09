import { displayPhone } from "./phone";

/** Shared shapes returned to the client. */

export function recipientForConsole(r: any) {
  return {
    id: String(r._id),
    name: r.name,
    phone: r.phone || "",
    email: r.email || "",
    display: r.phone ? displayPhone(r.phone) : "",
    active: r.active,
  };
}

export function productForConsole(p: any) {
  return {
    id: String(p._id),
    name: p.name,
    category: p.category,
    boxesPerCarton: p.boxesPerCarton,
    price: p.price,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    forceLowStock: p.forceLowStock,
    showStock: p.showStock === true,
    backorder: p.backorder,
    imageUrl: p.imageUrl || "",
  };
}

export function orderForConsole(o: any) {
  return {
    id: String(o._id),
    code: o.code,
    customerName: o.customerName,
    phone: o.phone,
    email: o.email || "",
    items: o.items.map((i: any) => ({
      name: i.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      backordered: i.backordered,
    })),
    itemsSummary: o.items.map((i: any) => `${i.name} x${i.qty}`).join(", "),
    total: o.total,
    method: o.method,
    status: o.status,
    hasBackorder: o.hasBackorder,
    refSource: o.refSource || "",
    createdAt: o.createdAt,
  };
}
