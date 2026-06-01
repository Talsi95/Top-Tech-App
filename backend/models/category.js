const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: false // Will be true after migration
    },
    name: {
        type: String,
        required: true
    },
    variantFields: [{
        type: String,
        required: false
    }],
    subcategories: [{
        name: { type: String, required: true }
    }],
    imageUrl: {
        type: String,
        default: ''
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

categorySchema.index({ name: 1, storeId: 1 }, { unique: true });


const Category = mongoose.model('Category', categorySchema);

module.exports = Category;