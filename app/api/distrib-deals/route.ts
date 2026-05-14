// app/api/distrib-deals/route.ts
import { dbConnect } from "@/lib/db";
import DistribDealModel from "@/app/models/DistribDealModel";
import ProductModel from "@/app/models/ProductModel";

export async function POST(req: Request) {
  const data = await req.json();

  if (!data.productId || !data.distributorId || !data.qty || data.qty <= 0) {
    return Response.json(
      { error: "Product, distributor, and valid quantity are required" },
      { status: 400 }
    );
  }

  if (data.upfrontPayment < 0) {
    return Response.json(
      { error: "Upfront payment cannot be negative" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    const product = await ProductModel.findById(data.productId);
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.stock < data.qty) {
      return Response.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const unitPrice = product.unitPrice || product.price || 0;
    const total = data.price ?? unitPrice * data.qty;
    const upfrontPayment = Math.min(data.upfrontPayment ?? 0, total);
    const balancePayment = total - upfrontPayment;

    const deal = await DistribDealModel.create({
      productId: data.productId,
      distributorId: data.distributorId,
      qty: data.qty,
      unitPrice,
      upfrontPayment,
      balancePayment,
      total,
      balancePaid: false,
      saleDate: data.saleDate ? new Date(data.saleDate) : new Date(),
    });

    await ProductModel.findByIdAndUpdate(data.productId, {
      $inc: { stock: -data.qty },
    });

    await deal.populate("productId", "name price");
    await deal.populate("distributorId", "name phone");

    return Response.json(
      { data: deal, message: "Deal created successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to create deal:", error);
    return Response.json(
      { error: error.message || "Failed to create deal" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");

  try {
    await dbConnect();

    let query: Record<string, any> = {};
    if (status === "paid") {
      query = { balancePaid: true };
    } else if (status === "pending") {
      query = { balancePaid: false };
    }

    const deals = await DistribDealModel.find(query)
      .sort({ saleDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("productId", "name price")
      .populate("distributorId", "name phone").lean();

    const total = await DistribDealModel.countDocuments(query);

    return Response.json(
      {
        data: deals,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error, message: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}