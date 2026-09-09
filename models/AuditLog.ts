import { Document, Model } from "mongoose";
import * as Mongoose from "mongoose";

/** Who changed stock, who moved an order along. */
const auditLogSchema = new Mongoose.Schema(
  {
    staffId: { type: String, required: true },
    staffName: { type: String, required: true },
    action: { type: String, required: true }, // e.g. "stock.adjust", "order.status", "product.add"
    target: { type: String, default: "" }, // product name / order code
    detail: { type: String, default: "" },
  },
  { timestamps: true }
);

export interface IAuditLog {
  staffId: string;
  staffName: string;
  action: string;
  target: string;
  detail: string;
  createdAt?: Date;
}

interface IAuditLogDocument extends IAuditLog, Document {}
interface IAuditLogModel extends Model<IAuditLogDocument> {}

const AuditLogModel: IAuditLogModel =
  (Mongoose.models.auditLog as IAuditLogModel) ||
  Mongoose.model<IAuditLogDocument>("auditLog", auditLogSchema);

export async function writeAudit(entry: {
  staffId: string;
  staffName: string;
  action: string;
  target?: string;
  detail?: string;
}) {
  try {
    await AuditLogModel.create({ target: "", detail: "", ...entry });
  } catch (err) {
    console.error("audit write failed", err);
  }
}

export default AuditLogModel;
