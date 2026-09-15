import { Document, Model } from "mongoose";
import * as Mongoose from "mongoose";

/**
 * One row per browser/device a staff member has enabled order alerts on.
 * `endpoint` is unique per subscription — a rep with a phone AND a desk
 * computer gets two rows, and both receive the push.
 */
const pushSubscriptionSchema = new Mongoose.Schema(
  {
    staffId: { type: String, required: true, lowercase: true, trim: true },
    endpoint: { type: String, required: true, unique: true },
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

export interface IPushSubscription {
  staffId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IPushSubscriptionDocument extends IPushSubscription, Document {}
interface IPushSubscriptionModel extends Model<IPushSubscriptionDocument> {}

const PushSubscriptionModel: IPushSubscriptionModel =
  (Mongoose.models.pushSubscription as IPushSubscriptionModel) ||
  Mongoose.model<IPushSubscriptionDocument>("pushSubscription", pushSubscriptionSchema);

export default PushSubscriptionModel;
