import { Document, Model } from "mongoose";
import * as Mongoose from "mongoose";

/**
 * Stock is tracked in BOXES — the smallest unit reps count and customers order.
 * `boxesPerCarton` is only a conversion factor used when stock arrives in cartons.
 */
const productSchema = new Mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    // art / category — drives which illustration the storefront renders
    category: {
      type: String,
      enum: ["bottle", "syrup", "jar", "pump", "tube", "dropper", "granule", "cream", "powder", "condom"],
      default: "bottle",
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
  category: "bottle" | "syrup" | "jar" | "pump" | "tube" | "dropper" | "granule" | "cream" | "powder" | "condom";
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
