// app/api/personal-sales/[id]/route.ts
import { dbConnect } from "@/lib/db";
import PersonalSaleModel from "@/app/models/PersonalSaleModel";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const sale = await PersonalSaleModel.findByIdAndDelete(id);
    if (!sale) {
      return Response.json({ error: "Sale not found" }, { status: 404 });
    }

    return Response.json(
      { message: "Sale deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to delete sale:", error);
    return Response.json(
      { error: error.message || "Failed to delete sale" },
      { status: 500 }
    );
  }
}