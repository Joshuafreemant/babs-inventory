import { dbConnect } from "@/app/lib/db";
import ProductModel from "@/models/Product";
import OrderModel from "@/models/Order";
import { requireStaff } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { productForConsole } from "@/app/lib/serialize";
import { toBoxes } from "@/app/lib/money";
import { deleteProductImage } from "@/app/lib/cloudinary";
import { CATEGORIES as CATEGORY_DEFS, DRUG_CATEGORIES } from "@/app/types";

export const dynamic = "force-dynamic";

const CATEGORIES: string[] = CATEGORY_DEFS.map((c) => c.id);
const DRUG_CATEGORY_IDS: string[] = DRUG_CATEGORIES.map((c) => c.id);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * One endpoint for every ledger edit, chosen by `op`:
 *  - "adjust"  { delta }                       single-box +/- stepper
 *  - "set"     { stock }                       type an exact count directly
 *  - "restock" { cartons, loose }              count a fresh delivery, add exactly
 *  - "flags"   { forceLowStock?, showStock?, backorder? }
 *  - "edit"    { name?, category?, drugCategory?, price?, boxesPerCarton?, lowStockThreshold?, backorder? }
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    await dbConnect();
    const b = await req.json();

    const product = await ProductModel.findById((await params).id);
    if (!product) return Response.json({ error: "Product not found." }, { status: 404 });

    const op = b.op as string;

    if (op === "adjust") {
      const delta = Math.floor(Number(b.delta));
      if (!Number.isFinite(delta) || delta === 0)
        return Response.json({ error: "Nothing to change." }, { status: 400 });
      product.stock = Math.max(0, product.stock + delta);
      await product.save();
      await writeAudit({
        staffId: staff.staffId,
        staffName: staff.name,
        action: "stock.adjust",
        target: product.name,
        detail: `${delta > 0 ? "+" : ""}${delta} box -> ${product.stock}`,
      });
    } else if (op === "set") {
      const stock = Math.max(0, Math.floor(Number(b.stock)));
      if (!Number.isFinite(stock))
        return Response.json({ error: "Enter a valid stock count." }, { status: 400 });
      if (stock === product.stock)
        return Response.json({ error: "Nothing to change." }, { status: 400 });
      const before = product.stock;
      product.stock = stock;
      await product.save();
      await writeAudit({
        staffId: staff.staffId,
        staffName: staff.name,
        action: "stock.set",
        target: product.name,
        detail: `${before} -> ${stock} (typed in)`,
      });
    } else if (op === "restock") {
      const cartons = Math.max(0, Math.floor(Number(b.cartons) || 0));
      const loose = Math.max(0, Math.floor(Number(b.loose) || 0));
      const adding = toBoxes(cartons, loose, product.boxesPerCarton);
      if (adding <= 0)
        return Response.json({ error: "Enter cartons or loose boxes received." }, { status: 400 });
      product.stock += adding;
      await product.save();
      await writeAudit({
        staffId: staff.staffId,
        staffName: staff.name,
        action: "stock.restock",
        target: product.name,
        detail: `+${adding} boxes (${cartons} cartons + ${loose} loose) -> ${product.stock}`,
      });
    } else if (op === "flags") {
      const changed: string[] = [];
      if (typeof b.forceLowStock === "boolean") {
        product.forceLowStock = b.forceLowStock;
        changed.push(`selling-fast=${b.forceLowStock}`);
      }
      if (typeof b.showStock === "boolean") {
        product.showStock = b.showStock;
        changed.push(`show-stock=${b.showStock}`);
      }
      if (typeof b.backorder === "boolean") {
        product.backorder = b.backorder;
        changed.push(`ships-when-out=${b.backorder}`);
      }
      await product.save();
      await writeAudit({
        staffId: staff.staffId,
        staffName: staff.name,
        action: "product.flags",
        target: product.name,
        detail: changed.join(", "),
      });
    } else if (op === "edit") {
      const changed: string[] = [];
      const before = product.name;

      if (typeof b.name === "string" && b.name.trim()) {
        const name = b.name.trim();
        if (name.toLowerCase() !== product.name.toLowerCase()) {
          const clash = await ProductModel.findOne({
            _id: { $ne: product._id },
            name: new RegExp(`^${escapeRe(name)}$`, "i"),
          });
          if (clash)
            return Response.json(
              { error: "Another product already has that name." },
              { status: 409 }
            );
          changed.push(`name "${product.name}" -> "${name}"`);
          product.name = name;
        }
      }
      if (typeof b.category === "string" && CATEGORIES.includes(b.category)) {
        if (b.category !== product.category) changed.push(`category ${b.category}`);
        product.category = b.category;
      }
      if (typeof b.drugCategory === "string" && DRUG_CATEGORY_IDS.includes(b.drugCategory)) {
        if (b.drugCategory !== product.drugCategory) changed.push(`classification ${b.drugCategory}`);
        product.drugCategory = b.drugCategory;
      }
      if (b.price !== undefined) {
        const price = Math.floor(Number(b.price));
        if (!price || price <= 0)
          return Response.json({ error: "Price per box must be greater than zero." }, { status: 400 });
        if (price !== product.price) changed.push(`price ${price}`);
        product.price = price;
      }
      if (b.boxesPerCarton !== undefined) {
        const bpc = Math.floor(Number(b.boxesPerCarton));
        if (!bpc || bpc <= 0)
          return Response.json({ error: "Boxes per carton must be greater than zero." }, { status: 400 });
        if (bpc !== product.boxesPerCarton) changed.push(`boxes/carton ${bpc}`);
        product.boxesPerCarton = bpc;
      }
      if (b.lowStockThreshold !== undefined) {
        const th = Math.floor(Number(b.lowStockThreshold));
        if (Number.isFinite(th) && th >= 0) {
          if (th !== product.lowStockThreshold) changed.push(`threshold ${th}`);
          product.lowStockThreshold = th;
        }
      }
      if (typeof b.backorder === "boolean") {
        if (b.backorder !== product.backorder) changed.push(`ships-when-out=${b.backorder}`);
        product.backorder = b.backorder;
      }

      if (changed.length === 0) {
        return Response.json({ error: "Nothing to change." }, { status: 400 });
      }
      await product.save();
      await writeAudit({
        staffId: staff.staffId,
        staffName: staff.name,
        action: "product.edit",
        target: before,
        detail: changed.join("; "),
      });
    } else {
      return Response.json({ error: "Unknown operation." }, { status: 400 });
    }

    return Response.json(productForConsole(product));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PATCH /api/admin/products/[id]", err);
    return Response.json({ error: "Could not update the product." }, { status: 500 });
  }
}

/**
 * Remove a product from the inventory.
 * If it has never been ordered it is deleted outright (and its photo cleaned up).
 * If it appears in past orders it is archived — hidden from the catalogue and the
 * ledger, but kept so sales history and reports stay intact.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    await dbConnect();

    const product = await ProductModel.findById((await params).id);
    if (!product) return Response.json({ error: "Product not found." }, { status: 404 });

    const orderCount = await OrderModel.countDocuments({ "items.product": product._id });

    if (orderCount === 0) {
      if (product.imagePublicId) deleteProductImage(product.imagePublicId);
      await product.deleteOne();
      await writeAudit({
        staffId: staff.staffId,
        staffName: staff.name,
        action: "product.delete",
        target: product.name,
        detail: "permanently removed (no order history)",
      });
      return Response.json({ removed: true, hard: true });
    }

    product.archived = true;
    await product.save();
    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "product.archive",
      target: product.name,
      detail: `hidden — kept for ${orderCount} order(s) of history`,
    });
    return Response.json({ removed: true, hard: false, orders: orderCount });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/admin/products/[id]", err);
    return Response.json({ error: "Could not remove the product." }, { status: 500 });
  }
}
