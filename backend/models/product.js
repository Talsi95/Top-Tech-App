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
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: false
    },
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
    video: {
        type: { type: String, enum: ['link', 'cloudinary'], default: 'link' },
        url: { type: String, default: '' },
        title: { type: String, default: '' },
        description: { type: String, default: '' }
    },
    technicalSpecs: [{
        key: { type: String },
        value: { type: String }
    }],
    category: { type: String, required: true },
    subcategory: { type: String, required: false },
    options: [{
        name: { type: String, required: true },
        choices: [{
            name: { type: String, required: true },
            priceAddition: { type: Number, default: 0 }
        }]
    }],
    variants: [variantSchema]
}, {
    timestamps: true
});

productSchema.index({ storeId: 1, slug: 1 });

productSchema.index({ storeId: 1, category: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;