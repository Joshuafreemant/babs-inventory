// models/DistribDealModel.ts
import mongoose from 'mongoose';

const DistribDealSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  distributorId: {
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
  upfrontPayment: {
    type: Number,
    required: true,
    default: 0,
  },
  balancePayment: {
    type: Number,
    required: true,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  balancePaid: {
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

export default mongoose.models.DistribDeal || mongoose.model('DistribDeal', DistribDealSchema);