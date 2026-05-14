// app/api/personal-purchases/route.ts
import { dbConnect } from "@/lib/db";
import ProductModel from "@/app/models/ProductModel";
import PersonalPurchaseModel from "@/app/models/PersonalPurchaseModel";

export async function POST(req: Request) {
  const data = await req.json();

  if (!data.productId || !data.qty || data.qty <= 0) {
    return Response.json(
      { error: "Product and valid quantity are required" },
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
      return Response.json({ error: "Insufficient stock in company inventory" }, { status: 400 });
    }

    // Use the provided price if given, otherwise use product unit price
    const unitPrice = data.price
      ? data.price / data.qty
      : product.unitPrice || product.price || 0;
    const total = data.price ?? unitPrice * data.qty;

    const purchase = await PersonalPurchaseModel.create({
      productId: data.productId,
      qty: data.qty,
      unitPrice,
      total,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
    });

    // Deduct from company stock — you're buying from the company
    await ProductModel.findByIdAndUpdate(data.productId, {
      $inc: { stock: -data.qty },
    });

    await purchase.populate("productId", "name price unitPrice");

    return Response.json(
      { data: purchase, message: "Purchase recorded successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to record personal purchase:", error);
    return Response.json(
      { error: error.message || "Failed to record purchase" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    await dbConnect();

    const purchases = await PersonalPurchaseModel.find()
      .sort({ purchaseDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("productId", "name price unitPrice").lean();

    const total = await PersonalPurchaseModel.countDocuments();

    return Response.json(
      {
        data: purchases,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error, message: "Failed to fetch purchases" },
      { status: 500 }
    );
  }
}