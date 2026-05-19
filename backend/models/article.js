const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articleSchema = new Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Ensure slugs are unique per store
articleSchema.index({ slug: 1, storeId: 1 }, { unique: true });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
