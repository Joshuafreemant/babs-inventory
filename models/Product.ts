import { Document, Model } from "mongoose";
import * as Mongoose from "mongoose";

/**
 * Stock is tracked in BOXES — the smallest unit reps count and customers order.
 * `boxesPerCarton` is only a conversion factor used when stock arrives in cartons.
 */
const productSchema = new Mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    // legacy art/shape field — only ever drives the icon shown when a product has no
    // photo. No longer editable by staff (superseded by drugCategory below), and
    // deliberately NOT enum-constrained: a stray/legacy value here must never block
    // a save on this document (ProductArt falls back safely for anything it doesn't
    // recognise) — that's exactly what happened when this used to be a strict enum.
    category: {
      type: String,
      default: "bottle",
    },
    // therapeutic classification — shown to staff and (later) customers
    drugCategory: {
      type: String,
      enum: [
        "analgesics",
        "antibiotics",
        "antivirals",
        "antifungals",
        "antimalarials",
        "cardiovascular",
        "respiratory",
        "gastrointestinal",
        "endocrine_diabetes",
        "cns_neurological",
        "psychiatric",
        "dermatological",
        "ophthalmic",
        "ent",
        "vitamins_supplements",
        "vaccines_immunizations",
        "oncology_chemotherapy",
        "hormonal_reproductive",
        "urological",
        "anti_inflammatory_steroids",
        "anesthetics",
      ],
      default: "cardiovascular",
    },
    boxesPerCarton: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // naira, per box
    stock: { type: Number, required: true, min: 0, default: 0 }, // boxes
    lowStockThreshold: { type: Number, required: true, min: 0, default: 0 }, // boxes
    forceLowStock: { type: Boolean, default: false }, // manual "Selling fast" flag (auto below threshold too)
    showStock: { type: Boolean, default: false }, // reveal the remaining box count to customers on the storefront (opt-in per product)
    backorder: { type: Boolean, default: false }, // "Ships when out"
    archived: { type: Boolean, default: false },
    imageUrl: { type: String, default: "" }, // Cloudinary secure_url, one photo per product
    imagePublicId: { type: String, default: "" }, // for replace / delete
  },
  { timestamps: true }
);

export interface IProduct {
  name: string;
  category: string;
  drugCategory:
    | "analgesics"
    | "antibiotics"
    | "antivirals"
    | "antifungals"
    | "antimalarials"
    | "cardiovascular"
    | "respiratory"
    | "gastrointestinal"
    | "endocrine_diabetes"
    | "cns_neurological"
    | "psychiatric"
    | "dermatological"
    | "ophthalmic"
    | "ent"
    | "vitamins_supplements"
    | "vaccines_immunizations"
    | "oncology_chemotherapy"
    | "hormonal_reproductive"
    | "urological"
    | "anti_inflammatory_steroids"
    | "anesthetics";
  boxesPerCarton: number;
  price: number;
  stock: number;
  lowStockThreshold: number;
  forceLowStock: boolean;
  showStock: boolean;
  backorder: boolean;
  archived: boolean;
  imageUrl: string;
  imagePublicId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IProductDocument extends IProduct, Document {}
interface IProductModel extends Model<IProductDocument> {}

const ProductModel: IProductModel =
  (Mongoose.models.product as IProductModel) ||
  Mongoose.model<IProductDocument>("product", productSchema);

export default ProductModel;
