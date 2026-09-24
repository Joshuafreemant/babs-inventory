import { Document, Model } from "mongoose";
import * as Mongoose from "mongoose";

const orderItemSchema = new Mongoose.Schema(
  {
    product: { type: Mongoose.Schema.Types.ObjectId, ref: "product", required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 }, // in sellUnit
    unitPrice: { type: Number, required: true, min: 0 }, // naira per sellUnit, snapshot
    lineTotal: { type: Number, required: true, min: 0 },
    backordered: { type: Boolean, default: false },
    // snapshot at order time, so the unit/carton breakdown shown later never
    // drifts if the product's packing or sell unit is edited afterwards
    boxesPerCarton: { type: Number, default: 1 },
    sellUnit: { type: String, enum: ["box", "packet"], default: "box" },
    packetsPerBox: { type: Number },
  },
  { _id: false }
);

export const ORDER_STATUSES = [
  "reserved", // Reserve, pay at the stand
  "awaiting_transfer", // Bank transfer, not yet confirmed
  "paid",
  "dispatched",
  "collected",
  "cancelled",
] as const;

const orderSchema = new Mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g. EMB-0007
    customerName: { type: String, required: true, trim: true }, // pharmacy / hospital
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["stand", "transfer"], required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "reserved" },
    hasBackorder: { type: Boolean, default: false },
    // staffId of the rep whose shared link the buyer arrived through ("" = direct)
    refSource: { type: String, default: "" },
    // staff who marked the order paid — the invoice's "issued by"; set once, never overwritten
    issuedByStaffId: { type: String, default: "" },
    issuedByName: { type: String, default: "" },
  },
  { timestamps: true }
);

orderSchema.index({ phone: 1, createdAt: -1 });

export interface IOrderItem {
  product: any;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  backordered: boolean;
  boxesPerCarton: number;
  sellUnit: "box" | "packet";
  packetsPerBox?: number;
}

export interface IOrder {
  code: string;
  customerName: string;
  phone: string;
  email: string;
  items: IOrderItem[];
  total: number;
  method: "stand" | "transfer";
  status: (typeof ORDER_STATUSES)[number];
  hasBackorder: boolean;
  refSource: string;
  issuedByStaffId: string;
  issuedByName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IOrderDocument extends IOrder, Document {}
interface IOrderModel extends Model<IOrderDocument> {}

const OrderModel: IOrderModel =
  (Mongoose.models.order as IOrderModel) ||
  Mongoose.model<IOrderDocument>("order", orderSchema);

export default OrderModel;
