// app/api/personal-sales/[id]/toggle-paid/route.ts
import PersonalSaleModel from "@/app/models/PersonalSaleModel";
import { dbConnect } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    const sale = await PersonalSaleModel.findById(id);
    if (!sale) {
      return Response.json({ error: "Sale not found" }, { status: 404 });
    }

    sale.paid = !sale.paid;
    sale.updatedAt = new Date();
    await sale.save();

    await sale.populate("productId", "name price unitPrice");

    return Response.json(
      {
        data: sale,
        message: `Sale marked as ${sale.paid ? "paid" : "unpaid"}`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to update sale:", error);
    return Response.json(
      { error: error.message || "Failed to update sale" },
      { status: 500 }
    );
  }
}