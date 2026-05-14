// app/api/customers/route.ts
import { dbConnect } from "@/lib/db";
import CustomerModel from "@/app/models/CustomerModel";

export async function POST(req: Request) {
  const data = await req.json();

  if (!data.name || !data.phone) {
    return Response.json({ error: "Name and phone are required" }, { status: 400 });
  }

  try {
    await dbConnect();

    const customer = await CustomerModel.create({
      name: data.name,
      phone: data.phone,
      email: data.email || "",
      address: data.address || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return Response.json({ data: customer, message: "Customer created successfully" }, { status: 200 });
  } catch (error) {
    return Response.json({ error, message: "Failed to create customer" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    await dbConnect();

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]
      };
    }

    const customers = await CustomerModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit).lean();

    const total = await CustomerModel.countDocuments(query);

    return Response.json({
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    return Response.json({ error, message: "Failed to fetch customers" }, { status: 500 });
  }
}