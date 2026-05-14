// models/PersonalSaleModel.ts
import mongoose from 'mongoose';

const PersonalSaleSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false,
    },
    buyer: {
        type: String,
        default: "",
    },
    buyerType: {
        type: String,
        enum: ['pharmacy', 'hospital'],
        default: 'pharmacy',
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.PersonalSale ||
    mongoose.model('PersonalSale', PersonalSaleSchema);