// app/api/distrib-deals/[id]/toggle-balance/route.ts
import { dbConnect } from "@/lib/db";
import DistribDealModel from "@/app/models/DistribDealModel";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    const deal = await DistribDealModel.findById(id);
    if (!deal) {
      return Response.json({ error: "Deal not found" }, { status: 404 });
    }

    deal.balancePaid = !deal.balancePaid;
    deal.updatedAt = new Date();
    await deal.save();

    await deal.populate("productId", "name price");
    await deal.populate("distributorId", "name phone");

    return Response.json(
      {
        data: deal,
        message: `Balance marked as ${deal.balancePaid ? "paid" : "unpaid"}`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to update deal:", error);
    return Response.json(
      { error: error.message || "Failed to update deal" },
      { status: 500 }
    );
  }
}