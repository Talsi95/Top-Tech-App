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
    category: {
        main: {
            type: String,
            required: true
        },
        sub: {
            type: String,
            required: true
        }
    },
    variants: [
        {
            color: { type: String, required: true },
            storage: { type: String, required: false },
            price: { type: Number, required: true },
            stock: { type: Number, required: true, default: 0 },
            imageUrl: { type: String, required: true }
        }
    ]
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;