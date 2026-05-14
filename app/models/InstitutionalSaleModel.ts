// models/InstitutionalSaleModel.ts
import mongoose from 'mongoose';

const InstitutionalSaleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 0.1,
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
  dueDate: {
    type: Date,
    required: true,
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

export default mongoose.models.InstitutionalSale ||
  mongoose.model('InstitutionalSale', InstitutionalSaleSchema);