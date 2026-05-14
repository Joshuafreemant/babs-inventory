// app/api/personal-sales/route.ts
import { dbConnect } from "@/lib/db";
import PersonalSaleModel from "@/app/models/PersonalSaleModel";
import ProductModel from "@/app/models/ProductModel";

export async function POST(req: Request) {
  const data = await req.json();

  // Accept either customerId or buyer string
  if (!data.productId || (!data.customerId) || !data.qty || data.qty <= 0) {
    return Response.json(
      { error: "Product, customer, and valid quantity are required" },
      { status: 400 }
    );
  }

  if (!data.total || data.total <= 0) {
    return Response.json({ error: "Total price must be greater than 0" }, { status: 400 });
  }

  try {
    await dbConnect();

    const product = await ProductModel.findById(data.productId);
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const unitPrice = data.total / data.qty;

    const sale = await PersonalSaleModel.create({
      productId: data.productId,
      customerId: data.customerId || null,   // ← store customerId
      buyer: data.buyer?.trim() || "",        // ← keep buyer for backwards compat
      buyerType: data.buyerType || "pharmacy",
      qty: data.qty,
      unitPrice,
      total: data.total,
      paid: false,
      saleDate: data.saleDate ? new Date(data.saleDate) : new Date(),
    });

    await sale.populate("productId", "name price unitPrice");
    await sale.populate("customerId", "name phone");  // ← populate customer

    return Response.json(
      { data: sale, message: "Sale recorded successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to record personal sale:", error);
    return Response.json(
      { error: error.message || "Failed to record sale" },
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
    if (status === "paid") query = { paid: true };
    else if (status === "pending") query = { paid: false };

    const sales = await PersonalSaleModel.find(query)
      .sort({ saleDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("productId", "name price unitPrice")
      .populate("customerId", "name phone").lean();

    const total = await PersonalSaleModel.countDocuments(query);

    return Response.json(
      {
        data: sales,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error, message: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}