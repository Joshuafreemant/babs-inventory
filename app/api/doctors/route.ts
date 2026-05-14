
// app/api/doctors/route.ts
import { dbConnect } from "@/lib/db";
import DoctorModel from "@/app/models/DoctorModel";

export async function POST(req: Request) {
  const data = await req.json();

  if (!data.name?.trim() || !data.phone?.trim()) {
    return Response.json(
      { error: "Name and phone number are required" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    const existing = await DoctorModel.findOne({
      phone: data.phone.trim(),
      isActive: true,
    });

    if (existing) {
      return Response.json(
        { error: "A doctor with this phone number already exists" },
        { status: 400 }
      );
    }

    const doctor = await DoctorModel.create({
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || "",
      department: data.department?.trim() || "",
      hospital: data.hospital?.trim() || "",
      specialty: data.specialty?.trim() || "",
      notes: data.notes?.trim() || "",
    });

    return Response.json(
      { data: doctor, message: "Doctor added successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to create doctor:", error);
    return Response.json(
      { error: error.message || "Failed to add doctor" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const hospital = searchParams.get("hospital");
  const department = searchParams.get("department");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    await dbConnect();

    let query: any = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { hospital: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (hospital) query.hospital = { $regex: hospital, $options: "i" };
    if (department) query.department = { $regex: department, $options: "i" };

    const [doctors, total] = await Promise.all([
      DoctorModel.find(query)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      DoctorModel.countDocuments(query),
    ]);

    const hospitals = await DoctorModel.distinct("hospital", { isActive: true });
    const departments = await DoctorModel.distinct("department", { isActive: true });

    return Response.json({
      data: doctors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      filters: { hospitals, departments },
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}