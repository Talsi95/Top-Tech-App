const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const variantSchema = new Schema({
    price: { type: Number, required: true },
    stock: { type: Number, required: false, default: 0 },
    imageUrls: [{ type: String, required: true }],
    isOnSale: {
        type: Boolean,
        default: false
    },
    salePrice: {
        type: Number,
        required: false,
        default: null
    }
}, { strict: false });

const productSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    longDescription: {
        type: String,
        required: false
    },
    additionalImages: [{
        url: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: false,
            default: ''
        }
    }],
    videos: [{
        title: { type: String },
        url: { type: String },
        description: { type: String, required: false, default: '' }
    }],
    technicalSpecs: [{
        key: { type: String },
        value: { type: String }
    }],
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    variants: [variantSchema]
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;