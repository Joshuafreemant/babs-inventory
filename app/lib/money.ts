/** ₦ formatting + the carton/box arithmetic that keeps stock honest. */

export const naira = (n: number | null | undefined): string =>
  "₦" + Number(n ?? 0).toLocaleString("en-NG");

/** Break a box count into full cartons + loose boxes for display. */
export function cartonBreakdown(stockBoxes: number, boxesPerCarton: number) {
  const bpc = boxesPerCarton > 0 ? boxesPerCarton : 1;
  return {
    cartons: Math.floor(stockBoxes / bpc),
    loose: stockBoxes % bpc,
  };
}

/** cartons + loose boxes -> exact box total. */
export function toBoxes(cartons: number, loose: number, boxesPerCarton: number): number {
  return (cartons || 0) * (boxesPerCarton || 0) + (loose || 0);
}

/** Sensible low-stock cut-off suggested from opening stock (~15%, min 20 boxes). */
export function suggestThreshold(stockBoxes: number): number {
  return Math.max(20, Math.round(stockBoxes * 0.15));
}

export function isLowStock(p: {
  stock: number;
  lowStockThreshold: number;
  forceLowStock: boolean;
}): boolean {
  return p.forceLowStock || (p.stock > 0 && p.stock <= p.lowStockThreshold);
}

export type StockStripe = { color: string; label: string };

/** Storefront status stripe for a product card. */
export function stockStripe(p: {
  stock: number;
  backorder: boolean;
  lowStockThreshold: number;
  forceLowStock: boolean;
}): StockStripe {
  if (p.stock === 0 && !p.backorder) return { color: "var(--rose)", label: "Out of stock" };
  if (p.stock === 0 && p.backorder)
    return { color: "var(--gold)", label: "Ships from regional stock" };
  if (isLowStock(p)) return { color: "var(--gold)", label: "Selling fast" };
  return { color: "var(--sage)", label: "In stock" };
}

export const METHOD_LABEL: Record<string, string> = {
  stand: "Reserved — pay at stand",
  transfer: "Awaiting transfer",
};

export const STATUS_LABEL: Record<string, string> = {
  reserved: "Reserved — pay at stand",
  awaiting_transfer: "Awaiting transfer",
  paid: "Paid",
  dispatched: "Dispatched",
  collected: "Collected",
  cancelled: "Cancelled",
};
