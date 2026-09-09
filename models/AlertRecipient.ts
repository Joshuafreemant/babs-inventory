import { Document, Model } from "mongoose";
import * as Mongoose from "mongoose";

/**
 * People who get notified on every new order — by SMS (phone), email, or both.
 * Managed from the console. A recipient needs at least one channel.
 */
const alertRecipientSchema = new Mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Warehouse Manager"
    phone: { type: String, default: "" }, // normalised, e.g. 2348030000000
    email: { type: String, default: "", lowercase: true, trim: true },
    active: { type: Boolean, default: true },
    addedBy: { type: String, default: "" }, // staffId
  },
  { timestamps: true }
);

export interface IAlertRecipient {
  name: string;
  phone: string;
  email: string;
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
