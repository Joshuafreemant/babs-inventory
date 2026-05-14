// models/KpiRecordModel.ts
import mongoose from 'mongoose';

// ── KPI Scoring Logic ───────────────────────────────────────────────────────
//
// Sales         → (actualSales / salesTarget) × 60   [can exceed 60 if over-target]
// Products      → sum of achieved product points      [active products should sum to 20]
// Institutional → min(distinctInstitutions, 2) × 2.5 [max 5 — auto-counted from InstitutionalSale]
// CME / PR      → min(cmePr, 2) × 2.5               [max 5 — manual entry]
// Daily Reports → min(dailyReports, 20) × 0.5        [max 10 — manual entry]
//
// actualSales and institutionalVisits are NOT stored here — they are always
// aggregated live from InstitutionalSale, DistribDeal, and DirectSale so that
// the KPI score automatically reflects any edits made in the sales module.
// ───────────────────────────────────────────────────────────────────────────

const ProductEntrySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KpiProduct',
      required: true,
    },
    achieved: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const KpiRecordSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },

  // ── Manually set ───────────────────────────────────────────────────────────
  salesTarget: {
    type: Number,
    default: 0,
    min: 0,
  },
  // CME/PR events: target is configurable, default 2/month → max 5 pts
  cmePr: {
    type: Number,
    default: 0,
    min: 0,
  },
  cmePrTarget: {
    type: Number,
    default: 2,
    min: 1,
  },
  // Daily reports submitted: target is configurable, default 20/month → max 10 pts
  dailyReports: {
    type: Number,
    default: 0,
    min: 0,
  },
  dailyReportsTarget: {
    type: Number,
    default: 20,
    min: 1,
  },
  // Which KpiProducts were achieved this month (product performance = 20 pts)
  productEntries: {
    type: [ProductEntrySchema],
    default: [],
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

// One record per month/year
KpiRecordSchema.index({ month: 1, year: 1 }, { unique: true });

export default mongoose.models.KpiRecord ||
  mongoose.model('KpiRecord', KpiRecordSchema);