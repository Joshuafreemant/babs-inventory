import { dbConnect } from "@/app/lib/db";
import ProductModel from "@/models/Product";
import { requireStaff } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { productForConsole } from "@/app/lib/serialize";
import { suggestThreshold, toBoxes } from "@/app/lib/money";

export const dynamic = "force-dynamic";

/** Inventory ledger — paginated with an `_id` cursor (creation order). */
export async function GET(req: Request) {
  try {
    await requireStaff();
    await dbConnect();

    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const cursor = url.searchParams.get("cursor");

    const filter: any = { archived: { $ne: true } };
    if (cursor) filter._id = { $gt: cursor };

    const docs = await ProductModel.find(filter)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const page = hasMore ? docs.slice(0, limit) : docs;
    const total = cursor
      ? undefined
      : await ProductModel.countDocuments({ archived: { $ne: true } });

    return Response.json({
      products: page.map(productForConsole),
      nextCursor: hasMore ? String(page[page.length - 1]._id) : null,
      hasMore,
      total,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/admin/products", err);
    return Response.json({ error: "Could not load inventory." }, { status: 500 });
  }
}

/** Add a product. Opening stock is given as cartons + loose boxes. */
export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    await dbConnect();
    const b = await req.json();

    const name = String(b.name || "").trim();
    const category = String(b.category || "bottle");
    const boxesPerCarton = Math.floor(Number(b.boxesPerCarton));
    const price = Math.floor(Number(b.price));
    const cartons = Math.max(0, Math.floor(Number(b.cartons) || 0));
    const loose = Math.max(0, Math.floor(Number(b.loose) || 0));
    const stock = toBoxes(cartons, loose, boxesPerCarton);
    const thresholdRaw = Number(b.threshold);
    const lowStockThreshold =
      Number.isFinite(thresholdRaw) && thresholdRaw >= 0
        ? Math.floor(thresholdRaw)
        : suggestThreshold(stock);

    if (!name) return Response.json({ error: "Give the product a name." }, { status: 400 });
    if (!boxesPerCarton || boxesPerCarton <= 0)
      return Response.json({ error: "Set how many boxes come in one carton." }, { status: 400 });
    if (!price || price <= 0)
      return Response.json({ error: "Enter a price per box." }, { status: 400 });
    if (cartons === 0 && loose === 0)
      return Response.json({ error: "Enter the opening stock received." }, { status: 400 });

    const clash = await ProductModel.findOne({
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });
    if (clash)
      return Response.json({ error: "A product with this name already exists." }, { status: 409 });

    const product = await ProductModel.create({
      name,
      category,
      boxesPerCarton,
      price,
      stock,
      lowStockThreshold,
      forceLowStock: false,
      backorder: Boolean(b.backorder),
    });

    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "product.add",
      target: name,
      detail: `opening stock ${stock} boxes (${cartons} cartons + ${loose} loose)`,
    });

    return Response.json(productForConsole(product));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/admin/products", err);
    return Response.json({ error: "Could not add the product." }, { status: 500 });
  }
}
