// app/models/DoctorModel.ts
import mongoose from "mongoose";

const DoctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    hospital: { type: String, trim: true, default: "" },
    specialty: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DoctorSchema.index({ name: 1 });
DoctorSchema.index({ hospital: 1 });
DoctorSchema.index({ phone: 1 });

export default mongoose.models.Doctor ||
  mongoose.model("Doctor", DoctorSchema);