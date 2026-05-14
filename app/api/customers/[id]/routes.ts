// app/api/customers/[id]/route.ts
import { dbConnect } from "@/lib/db";
import CustomerModel from "@/app/models/CustomerModel";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const customer = await CustomerModel.findById(params.id);
    
    if (!customer) {
      return Response.json({ error: "Customer not found" }, { status: 404 });
    }

    return Response.json({ data: customer }, { status: 200 });
  } catch (error) {
    return Response.json({ error, message: "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();

  try {
    await dbConnect();
    const customer = await CustomerModel.findByIdAndUpdate(
      params.id,
      { ...data, updatedAt: new Date() },
      { new: true }
    );

    if (!customer) {
      return Response.json({ error: "Customer not found" }, { status: 404 });
    }

    return Response.json({ data: customer, message: "Customer updated successfully" }, { status: 200 });
  } catch (error) {
    return Response.json({ error, message: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    await CustomerModel.findByIdAndDelete(params.id);
    return Response.json({ message: "Customer deleted successfully" }, { status: 200 });
  } catch (error) {
    return Response.json({ error, message: "Failed to delete customer" }, { status: 500 });
  }
}