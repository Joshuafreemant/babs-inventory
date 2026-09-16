import { Document, Model } from "mongoose";
import * as Mongoose from "mongoose";

/**
 * People who get an SMS on every new order. Managed from the console.
 */
const alertRecipientSchema = new Mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Warehouse Manager"
    phone: { type: String, required: true }, // normalised, e.g. 2348030000000
    active: { type: Boolean, default: true },
    addedBy: { type: String, default: "" }, // staffId
  },
  { timestamps: true }
);

export interface IAlertRecipient {
  name: string;
  phone: string;
  active: boolean;
  addedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IAlertRecipientDocument extends IAlertRecipient, Document {}
interface IAlertRecipientModel extends Model<IAlertRecipientDocument> {}

const AlertRecipientModel: IAlertRecipientModel =
  (Mongoose.models.alertRecipient as IAlertRecipientModel) ||
  Mongoose.model<IAlertRecipientDocument>("alertRecipient", alertRecipientSchema);

export default AlertRecipientModel;
