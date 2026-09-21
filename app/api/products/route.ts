import { dbConnect } from "@/app/lib/db";
import ProductModel from "@/models/Product";

export const dynamic = "force-dynamic";

/** Public catalogue — everything the storefront needs to render product cards. */
export async function GET() {
  try {
    await dbConnect();
    const products = await ProductModel.find({ archived: { $ne: true } })
      .sort({ createdAt: 1 })
      .lean();

    return Response.json(
      products.map((p: any) => ({
        id: String(p._id),
        name: p.name,
        category: p.category,
        drugCategory: p.drugCategory || "cardiovascular",
        boxesPerCarton: p.boxesPerCarton,
        sellUnit: p.sellUnit || "box",
        packetsPerBox: p.packetsPerBox,
        price: p.price,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        forceLowStock: p.forceLowStock,
        showStock: p.showStock === true,
        backorder: p.backorder,
        imageUrl: p.imageUrl || "",
      }))
    );
  } catch (err) {
    console.error("GET /api/products", err);
    return Response.json({ error: "Could not load the catalogue." }, { status: 500 });
  }
}
