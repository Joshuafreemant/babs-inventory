// app/api/institutional-sales/[id]/toggle-paid/route.ts
import { dbConnect } from "@/lib/db";
import InstitutionalSaleModel from "@/app/models/InstitutionalSaleModel";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    const sale = await InstitutionalSaleModel.findById(id);
    if (!sale) {
      return Response.json({ error: "Sale not found" }, { status: 404 });
    }

    sale.paid = !sale.paid;
    sale.updatedAt = new Date();
    await sale.save();

    await sale.populate("productId", "name price");
    await sale.populate("institutionId", "name phone");

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