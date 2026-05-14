// app/models/ProductModel.ts
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    index: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    default: 'General',
  },
  description: {
    type: String,
    default: '',
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Price cannot be negative'],
  },
  instPrice: {
    type: Number,
    required: [true, 'Institutional price is required'],
    min: [0, 'Price cannot be negative'],
  },
  cartonQty: {
    type: Number,
    required: [true, 'Carton quantity is required'],
    min: [1, 'Carton quantity must be at least 1'],
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock cannot be negative'],
  },
  unit: {
    type: String,
    default: 'carton',
    enum: ['carton', 'piece', 'pack', 'bottle', 'box'],
  },
  dosageForm: {
    type: String,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'other'],
    default: 'tablet',
  },
  strength: {
    type: String,
    default: '',
  },
  manufacturer: {
    type: String,
    default: '',
  },
  supplier: {
    type: String,
    default: '',
  },
  expiryDate: {
    type: Date,
    default: null,
  },
  batchNumber: {
    type: String,
    default: '',
  },
  reorderLevel: {
    type: Number,
    default: 5,
    min: [0, 'Reorder level cannot be negative'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: String,
    default: 'System',
  },
  updatedBy: {
    type: String,
    default: 'System',
  },
}, {
  timestamps: true, // This automatically handles createdAt and updatedAt
});

// Remove the pre-save middleware that might be causing issues
// ProductSchema.pre('save', function(next) {
//   if (this.isModified()) {
//     this.updatedAt = new Date();
//   }
//   next();
// });

// Create indexes
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ 'name': 'text', 'category': 'text' });

// Check if model exists before creating
export default mongoose.models.Product || mongoose.model('Product', ProductSchema);

