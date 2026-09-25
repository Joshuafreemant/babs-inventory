import { dbConnect } from "@/app/lib/db";
import ProductModel from "@/models/Product";
import { requireStaff } from "@/app/lib/auth";
import { writeAudit } from "@/models/AuditLog";
import { productForConsole } from "@/app/lib/serialize";
import { suggestThreshold, toBoxes, toPackets } from "@/app/lib/money";
import { DRUG_CATEGORIES } from "@/app/types";

export const dynamic = "force-dynamic";

const DRUG_CATEGORY_IDS: string[] = DRUG_CATEGORIES.map((c) => c.id);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Inventory ledger — paginated with an `_id` cursor (creation order).
 *   ?q=<text>          narrow to products whose name contains this (case-insensitive)
 *   ?archived=true     list archived products instead of the active catalogue
 */
export async function GET(req: Request) {
  try {
    await requireStaff();
    await dbConnect();

    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const cursor = url.searchParams.get("cursor");
    const q = url.searchParams.get("q")?.trim();
    const archived = url.searchParams.get("archived") === "true";

    const filter: any = archived ? { archived: true } : { archived: { $ne: true } };
    if (q) filter.name = new RegExp(escapeRe(q), "i");
    if (cursor) filter._id = { $gt: cursor };

    const docs = await ProductModel.find(filter)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const page = hasMore ? docs.slice(0, limit) : docs;
    // total always reflects the current search — recount is cheap here since
    // the products collection is small and this only runs on page 1
    const total = cursor
      ? undefined
      : await ProductModel.countDocuments(
          q ? filter : archived ? { archived: true } : { archived: { $ne: true } }
        );

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
    const drugCategory = DRUG_CATEGORY_IDS.includes(b.drugCategory) ? b.drugCategory : "cardiovascular";
    const boxesPerCarton = Math.floor(Number(b.boxesPerCarton));
    const sellUnit = b.sellUnit === "packet" ? "packet" : "box";
    const packetsPerBox = sellUnit === "packet" ? Math.floor(Number(b.packetsPerBox)) : undefined;
    const price = Math.floor(Number(b.price));
    const cartons = Math.max(0, Math.floor(Number(b.cartons) || 0));
    const boxes = Math.max(0, Math.floor(Number(b.boxes) || 0));
    const loose = Math.max(0, Math.floor(Number(b.loose) || 0));
    const stock =
      sellUnit === "packet"
        ? toPackets(cartons, boxes, loose, boxesPerCarton, packetsPerBox || 0)
        : toBoxes(cartons, loose, boxesPerCarton);
    const thresholdRaw = Number(b.threshold);
    const lowStockThreshold =
      Number.isFinite(thresholdRaw) && thresholdRaw >= 0
        ? Math.floor(thresholdRaw)
        : suggestThreshold(stock);

    if (!name) return Response.json({ error: "Give the product a name." }, { status: 400 });
    if (!boxesPerCarton || boxesPerCarton <= 0)
      return Response.json({ error: "Set how many boxes come in one carton." }, { status: 400 });
    if (sellUnit === "packet" && (!packetsPerBox || packetsPerBox <= 0))
      return Response.json({ error: "Set how many packets come in one box." }, { status: 400 });
    if (!price || price <= 0)
      return Response.json(
        { error: sellUnit === "packet" ? "Enter a price per packet." : "Enter a price per box." },
        { status: 400 }
      );
    if (cartons === 0 && boxes === 0 && loose === 0)
      return Response.json({ error: "Enter the opening stock received." }, { status: 400 });

    const clash = await ProductModel.findOne({
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });
    if (clash)
      return Response.json({ error: "A product with this name already exists." }, { status: 409 });

    const product = await ProductModel.create({
      name,
      category,
      drugCategory,
      boxesPerCarton,
      sellUnit,
      packetsPerBox,
      price,
      stock,
      lowStockThreshold,
      forceLowStock: false,
      backorder: Boolean(b.backorder),
    });

    const detail =
      sellUnit === "packet"
        ? `opening stock ${stock} packets (${cartons} cartons + ${boxes} boxes + ${loose} loose)`
        : `opening stock ${stock} boxes (${cartons} cartons + ${loose} loose)`;
    await writeAudit({
      staffId: staff.staffId,
      staffName: staff.name,
      action: "product.add",
      target: name,
      detail,
    });

    return Response.json(productForConsole(product));
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/admin/products", err);
    return Response.json({ error: "Could not add the product." }, { status: 500 });
  }
}
