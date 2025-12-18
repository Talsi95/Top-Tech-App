const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    variantFields: [{
        type: String,
        enum: ['color', 'storage', 'size'],
        required: true
    }],
    subcategories: [{
        name: { type: String, required: true }
    }]
}, {
    timestamps: true
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;