import { Document, Model } from "mongoose";
import * as Mongoose from "mongoose";

/** Single-document settings keyed by a string id (currently just "storefront"). */
const settingSchema = new Mongoose.Schema(
  {
    _id: { type: String, required: true },
    heroEyebrow: { type: String, default: "" },
    heroHeadline: { type: String, default: "" },
    heroSubtext: { type: String, default: "" },
  },
  { timestamps: true }
);

export interface ISetting {
  _id: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ISettingDocument extends Omit<ISetting, "_id">, Document<string> {}
interface ISettingModel extends Model<ISettingDocument> {}

const SettingModel: ISettingModel =
  (Mongoose.models.setting as ISettingModel) ||
  Mongoose.model<ISettingDocument>("setting", settingSchema);

export default SettingModel;
