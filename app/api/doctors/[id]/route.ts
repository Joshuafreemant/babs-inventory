// app/api/doctors/[id]/route.ts
import { dbConnect } from "@/lib/db";
import DoctorModel from "@/app/models/DoctorModel";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    await dbConnect();

    const doctor = await DoctorModel.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    );

    if (!doctor) {
      return Response.json({ error: "Doctor not found" }, { status: 404 });
    }

    return Response.json({ data: doctor, message: "Doctor updated successfully" });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to update doctor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    await DoctorModel.findByIdAndUpdate(id, { isActive: false });

    return Response.json({ message: "Doctor removed successfully" });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to remove doctor" },
      { status: 500 }
    );
  }
}
