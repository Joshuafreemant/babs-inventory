import { dbConnect } from "@/lib/db";
import ProductModel from "@/app/models/ProductModel";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    await dbConnect();

    const product = await ProductModel.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ data: product, message: "Product updated" }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to update" }, { status: 500 });
  }
}