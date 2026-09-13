import { Document, Model } from "mongoose";
import * as Mongoose from "mongoose";

/** Single-document settings keyed by a string id (currently just "storefront"). */
const settingSchema = new Mongoose.Schema(
  {
    _id: { type: String, required: true },
    heroEyebrow: { type: String, default: "" },
    heroHeadline: { type: String, default: "" },
    heroSubtext: { type: String, default: "" },
    // customer-facing contact info shown on the storefront
    contactPhone: { type: String, default: "" }, // normalised digits, e.g. "2348032219087"
    contactEmail: { type: String, default: "" },
    // bank transfer details shown at checkout
    bankName: { type: String, default: "" },
    bankAccountNumber: { type: String, default: "" },
    bankAccountName: { type: String, default: "" },
  },
  { timestamps: true }
);

export interface ISetting {
  _id: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  contactPhone: string;
  contactEmail: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ISettingDocument extends Omit<ISetting, "_id">, Document<string> {}
interface ISettingModel extends Model<ISettingDocument> {}

const SettingModel: ISettingModel =
  (Mongoose.models.setting as ISettingModel) ||
  Mongoose.model<ISettingDocument>("setting", settingSchema);

export default SettingModel;
