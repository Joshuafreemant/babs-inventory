// app/api/institutional-sales/route.ts
import { dbConnect } from "@/lib/db";
import InstitutionalSaleModel from "@/app/models/InstitutionalSaleModel";
import ProductModel from "@/app/models/ProductModel";

export async function POST(req: Request) {
  const data = await req.json();

  if (!data.productId || !data.institutionId || !data.qty || data.qty <= 0) {
    return Response.json(
      { error: "Product, institution, and valid quantity are required" },
      { status: 400 }
    );
  }

  if (!data.dueDate) {
    return Response.json({ error: "Due date is required" }, { status: 400 });
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

    const sale = await InstitutionalSaleModel.create({
      productId: data.productId,
      institutionId: data.institutionId,
      qty: data.qty,
      unitPrice,
      total,
      paid: false,
      saleDate: data.saleDate ? new Date(data.saleDate) : new Date(),
      dueDate: new Date(data.dueDate),
    });

    await ProductModel.findByIdAndUpdate(data.productId, {
      $inc: { stock: -data.qty },
    });

    await sale.populate("productId", "name price");
    await sale.populate("institutionId", "name phone");

    return Response.json(
      { data: sale, message: "Sale recorded successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to create institutional sale:", error);
    return Response.json(
      { error: error.message || "Failed to create sale" },
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
      query = { paid: true };
    } else if (status === "pending") {
      query = { paid: false };
    } else if (status === "overdue") {
      query = { paid: false, dueDate: { $lt: new Date() } };
    }

    const sales = await InstitutionalSaleModel.find(query)
      .sort({ dueDate: 1 }) // soonest due first
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("productId", "name price")
      .populate("institutionId", "name phone").lean();

    const total = await InstitutionalSaleModel.countDocuments(query);

    return Response.json(
      {
        data: sales,
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
      { error, message: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}