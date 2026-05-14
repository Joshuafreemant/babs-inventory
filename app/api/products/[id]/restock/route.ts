import { dbConnect } from "@/lib/db";
import ProductModel from "@/app/models/ProductModel";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { qty } = await req.json();

    if (!qty || qty <= 0) {
      return Response.json({ error: "Valid quantity required" }, { status: 400 });
    }

    await dbConnect();

    const product = await ProductModel.findByIdAndUpdate(
      id,
      { $inc: { stock: qty }, updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ data: product, message: "Stock updated" }, { status: 200 });
  } catch (error: any) {
    console.error("Restock error:", error);
    return Response.json({ error: error.message || "Failed to restock" }, { status: 500 });
  }
}