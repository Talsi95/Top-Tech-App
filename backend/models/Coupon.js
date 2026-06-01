const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Coupon Schema
 * Represents a coupon for a specific store that can be applied during checkout.
 */
const couponSchema = new Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: [0, 'ערך ההנחה חייב להיות חיובי']
    },
    targetType: {
        type: String,
        enum: ['global', 'category', 'product'],
        required: true
    },
    targetIds: [{
        type: mongoose.Schema.Types.ObjectId,
        required: false
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    validFrom: {
        type: Date,
        required: true
    },
    validTo: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        required: false,
        min: [1, 'מגבלת שימושים חייבת להיות לפחות 1']
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// Compound unique index so coupon codes are unique per store, not globally.
couponSchema.index({ storeId: 1, code: 1 }, { unique: true });

// General index on code for quick lookups if needed.
couponSchema.index({ code: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
