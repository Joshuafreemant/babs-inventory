import { Document, Model } from "mongoose";
import * as Mongoose from "mongoose";

/** Internal users of the rep console. Customers never have accounts. */
const staffSchema = new Mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    staffId: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["rep", "admin"], default: "rep" },
    active: { type: Boolean, default: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

export interface IStaff {
  name: string;
  staffId: string;
  passwordHash: string;
  role: "rep" | "admin";
  active: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IStaffDocument extends IStaff, Document {}
interface IStaffModel extends Model<IStaffDocument> {}

const StaffModel: IStaffModel =
  (Mongoose.models.staff as IStaffModel) ||
  Mongoose.model<IStaffDocument>("staff", staffSchema);

export default StaffModel;
