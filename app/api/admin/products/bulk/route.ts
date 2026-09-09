import { dbConnect } from "@/app/lib/db";
import ProductModel from "@/models/Product";
import { requireStaff } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { productForConsole } from "@/app/lib/serialize";
import { suggestThreshold, toBoxes } from "@/app/lib/money";

export const dynamic = "force-dynamic";

const CATEGORIES = ["bottle", "syrup", "jar", "pump", "tube", "dropper"];
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Bulk-create products from a JSON array. Reps can add photos afterwards.
 *
 * body: { products: [ { name, price, boxesPerCarton,
 *                       category?, stock? | cartons?+loose?,
 *                       lowStockThreshold?, backorder?, imageUrl? } ] }
 *
 * Existing names are skipped (reported), so re-running a list is safe.
 */
export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    await dbConnect();

    const body = await req.json();
    const rows = Array.isArray(body?.products) ? body.products : Array.isArray(body) ? body : null;
    if (!rows) {
      return Response.json(
        { error: 'Send { "products": [ ... ] } — a JSON array of products.' },
        { status: 400 }
      );
    }
    if (rows.length === 0) return Response.json({ error: "The list is empty." }, { status: 400 });
    if (rows.length > 500)
      return Response.json({ error: "Import at most 500 products at a time." }, { status: 400 });

    const existing = new Set(
      (await ProductModel.find({}).select("name").lean()).map((p: any) => p.name.toLowerCase())
    );

    const created: any[] = [];
    const skipped: { name: string; reason: string }[] = [];
    const seenInBatch = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};
      const label = typeof r.name === "string" ? r.name.trim() : `row ${i + 1}`;
      const name = typeof r.name === "string" ? r.name.trim() : "";

      if (!name) {
        skipped.push({ name: label, reason: "missing name" });
        continue;
      }
      const key = name.toLowerCase();
      if (existing.has(key) || seenInBatch.has(key)) {
        skipped.push({ name, reason: "already in the catalogue" });
        continue;
      }

      const price = Math.floor(Number(r.price));
      const boxesPerCarton = Math.floor(Number(r.boxesPerCarton ?? r.boxes_per_carton));
      if (!price || price <= 0) {
        skipped.push({ name, reason: "price per box missing or not a number" });
        continue;
      }
      if (!boxesPerCarton || boxesPerCarton <= 0) {
        skipped.push({ name, reason: "boxesPerCarton missing or not a number" });
        continue;
      }

      let stock = 0;
      if (r.stock !== undefined && Number.isFinite(Number(r.stock))) {
        stock = Math.max(0, Math.floor(Number(r.stock)));
      } else if (r.cartons !== undefined || r.loose !== undefined) {
        stock = toBoxes(
          Math.max(0, Math.floor(Number(r.cartons) || 0)),
          Math.max(0, Math.floor(Number(r.loose) || 0)),
          boxesPerCarton
        );
      }

      const th = Number(r.lowStockThreshold ?? r.low_stock_threshold);
      const lowStockThreshold =
        Number.isFinite(th) && th >= 0 ? Math.floor(th) : suggestThreshold(stock);

      const category = CATEGORIES.includes(r.category) ? r.category : "bottle";
      const imageUrl = typeof r.imageUrl === "string" && /^https?:\/\//.test(r.imageUrl) ? r.imageUrl : "";

      try {
        const doc = await ProductModel.create({
          name,
          category,
          boxesPerCarton,
          price,
          stock,
          lowStockThreshold,
          forceLowStock: false,
          backorder: Boolean(r.backorder),
          imageUrl,
        });
        created.push(productForConsole(doc));
        seenInBatch.add(key);
      } catch (e: any) {
        skipped.push({ name, reason: e?.message || "could not save" });
      }
    }

    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "product.import",
      target: `${created.length} added`,
      detail: `${created.length} created, ${skipped.length} skipped of ${rows.length}`,
    });

    return Response.json({
      created,
      skipped,
      summary: { total: rows.length, created: created.length, skipped: skipped.length },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/admin/products/import", err);
    return Response.json({ error: "Could not import the products." }, { status: 500 });
  }
}
