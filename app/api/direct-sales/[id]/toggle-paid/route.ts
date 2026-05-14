// app/api/direct-sales/[id]/toggle-paid/route.ts
import { dbConnect } from "@/lib/db";
import DirectSaleModel from "@/app/models/DirectSaleModel";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;  // ← await params

    const sale = await DirectSaleModel.findById(id);
    if (!sale) {
      return Response.json({ error: "Sale not found" }, { status: 404 });
    }

    sale.paid = !sale.paid;
    sale.updatedAt = new Date();
    await sale.save();

    await sale.populate('productId', 'name price');
    await sale.populate('customerId', 'name phone');

    return Response.json({ 
      data: sale, 
      message: `Sale marked as ${sale.paid ? 'paid' : 'unpaid'}` 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Failed to update sale:", error);
    return Response.json({
      error: error.message || "Failed to update sale"
    }, { status: 500 });
  }
}