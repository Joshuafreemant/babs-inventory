// app/api/products/route.ts
import { dbConnect } from "@/lib/db";
import ProductModel from "@/app/models/ProductModel";

export async function POST(req: Request) {
  const data = await req.json();

  // Validate required fields
  if (!data.name || !data.unitPrice || !data.cartonQty) {
    return Response.json({
      error: "Name, unit price, and carton quantity are required"
    }, { status: 400 });
  }

  if (data.unitPrice < 0 || (data.instPrice && data.instPrice < 0)) {
    return Response.json({ error: "Prices cannot be negative" }, { status: 400 });
  }


  try {
    await dbConnect();

    // Check if product with same name already exists
    const existingProduct = await ProductModel.findOne({
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
      isActive: true
    });

    if (existingProduct) {
      return Response.json({ error: "Product with this name already exists" }, { status: 400 });
    }

    const product = await ProductModel.create({
      name: data.name.trim(),
      category: data.category || "General",
      description: data.description || "",
      unitPrice: Number(data.unitPrice),
      instPrice: Number(data.instPrice) || Number(data.unitPrice),
      cartonQty: Number(data.cartonQty),
      stock: Number(data.stock) || 0,
      unit: data.unit || "carton",
      dosageForm: data.dosageForm || "tablet",
      strength: data.strength || "",
      manufacturer: data.manufacturer || "",
      supplier: data.supplier || "",
      expiryDate: data.expiryDate || null,
      batchNumber: data.batchNumber || "",
      reorderLevel: data.reorderLevel || 5,
      createdBy: data.user || "System",
      updatedBy: data.user || "System",

    });

    return Response.json({
      data: product,
      message: "Product created successfully"
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating product:', error);
    return Response.json({
      error: error.message || "Failed to create product",
      message: "Product not created"
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const lowStock = searchParams.get('lowStock');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const isActive = searchParams.get('isActive');

  try {
    await dbConnect();

    let query: any = {};

    // Search by name or category
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter low stock products
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$reorderLevel'] };
    }

    // Filter by active status
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true; // default: only active products
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      ProductModel.find(query)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(query)
    ]);

    // Get unique categories for filters
    const categories = await ProductModel.distinct('category', { isActive: true });

    return Response.json({
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        categories
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching products:', error);
    return Response.json({
      error: error.message || "Failed to fetch products",
      message: "Products not fetched"
    }, { status: 500 });
  }
}

