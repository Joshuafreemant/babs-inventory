// app/api/direct-sales/route.ts
import { dbConnect } from "@/lib/db";
import DirectSaleModel from "@/app/models/DirectSaleModel";
import ProductModel from "@/app/models/ProductModel";

export async function POST(req: Request) {
  const data = await req.json();

  if (!data.productId || !data.customerId || !data.qty || data.qty <= 0) {
    return Response.json(
      { error: "Product, customer, and valid quantity are required" },
      { status: 400 },
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

    const sale = await DirectSaleModel.create({
      productId:  data.productId,
      customerId: data.customerId,
      qty:        data.qty,
      unitPrice,
      total,
      paid:       false,
      saleDate:   data.saleDate ? new Date(data.saleDate) : new Date(),
    });

    await ProductModel.findByIdAndUpdate(data.productId, {
      $inc: { stock: -data.qty },
    });

    await sale.populate("productId", "name price");
    await sale.populate("customerId", "name phone");

    return Response.json(
      { data: sale, message: "Sale created successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Failed to create sale:", error);
    return Response.json(
      { error: error.message || "Failed to create sale" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get("page")  || "1");
  const limit  = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") || "";
  const search = (searchParams.get("search") || "").toLowerCase().trim();

  // sortBy: "saleDate" | "amount" | "status" | "customer" | "product"
  // customer/product sort happens client-side after populate (see note below)
  const sortBy = searchParams.get("sortBy") || "saleDate";
  const order  = searchParams.get("order")  || "desc";

  const DB_SORT_MAP: Record<string, string> = {
    saleDate: "saleDate",
    amount:   "total",
    status:   "paid",
  };

  const sortField = DB_SORT_MAP[sortBy] ?? "saleDate";
  const sortDir   = order === "asc" ? 1 : -1;

  try {
    await dbConnect();

    const query: Record<string, unknown> = {};
    if (status === "paid")    query.paid = true;
    if (status === "pending") query.paid = false;

    // For customer/product sorts we fetch then sort in JS after populate.
    // For saleDate/amount/status we sort in the DB query directly.
    const isClientSort = ["customer", "product"].includes(sortBy);

    let sales = await DirectSaleModel.find(query)
      .sort(isClientSort ? { saleDate: -1 } : { [sortField]: sortDir })
      .populate("productId",  "name price")
      .populate("customerId", "name phone")
      .lean();

    // Text search across customer name and product name (post-populate)
    if (search) {
      sales = sales.filter((s: any) => {
        const customerName = (s.customerId as any)?.name?.toLowerCase() || "";
        const productName  = (s.productId  as any)?.name?.toLowerCase() || "";
        return customerName.includes(search) || productName.includes(search);
      });
    }

    // Client-side sort for populated string fields
    if (isClientSort) {
      sales.sort((a: any, b: any) => {
        const aVal =
          sortBy === "customer"
            ? (a.customerId as any)?.name?.toLowerCase() || ""
            : (a.productId  as any)?.name?.toLowerCase() || "";
        const bVal =
          sortBy === "customer"
            ? (b.customerId as any)?.name?.toLowerCase() || ""
            : (b.productId  as any)?.name?.toLowerCase() || "";
        return order === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
    }

    // Paginate after filtering/sorting
    const total      = sales.length;
    const paginated  = sales.slice((page - 1) * limit, page * limit);

    return Response.json({
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch sales:", error);
    return Response.json(
      { error: error.message, message: "Failed to fetch sales" },
      { status: 500 },
    );
  }
}