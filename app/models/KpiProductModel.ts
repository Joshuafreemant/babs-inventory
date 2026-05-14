// models/KpiProductModel.ts
import mongoose from 'mongoose';

// Each active product carries `points` that contribute to the 20-pt
// "Product Performance" bucket of the KPI scorecard.
// Active products' points should ideally sum to 20.

const KpiProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  points: {
    type: Number,
    required: true,
    min: 0,
  },
  active: {
    type: Boolean,
    default: true,
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

KpiProductSchema.pre('findOneAndUpdate', function () {
  this.set({ updatedAt: new Date() });
});

export default mongoose.models.KpiProduct ||
  mongoose.model('KpiProduct', KpiProductSchema);