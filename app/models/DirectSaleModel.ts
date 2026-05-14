// models/DirectSaleModel.ts
import mongoose from 'mongoose';

const DirectSaleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 0.1,
  },
  date: {
    type: String,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  saleDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.DirectSale || mongoose.model('DirectSale', DirectSaleSchema);