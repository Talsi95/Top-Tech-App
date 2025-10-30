const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
        url: { type: String }
    }],
    technicalSpecs: [{
        key: { type: String },
        value: { type: String }
    }],
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    variants: [
        {
            color: { type: String, required: true },
            storage: { type: String, required: false },
            size: { type: String, required: false },
            price: { type: Number, required: true },
            stock: { type: Number, required: true, default: 0 },
            imageUrl: { type: String, required: true },
            isOnSale: {
                type: Boolean,
                default: false
            },
            salePrice: {
                type: Number,
                required: false,
                default: null
            }
        }
    ]
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;