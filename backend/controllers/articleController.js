const Article = require('../models/article');

/**
 * Fetch all articles for a specific store.
 */
const getArticles = async (req, res) => {
    try {
        const articles = await Article.find({ storeId: req.storeId }).sort({ createdAt: -1 });
        res.status(200).json(articles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Fetch a single article by slug for a specific store.
 */
const getArticleBySlug = async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug, storeId: req.storeId });
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.status(200).json(article);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Create a new article.
 */
const createArticle = async (req, res) => {
    try {
        req.body.storeId = req.storeId;
        const newArticle = await Article.create(req.body);
        res.status(201).json(newArticle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Update an existing article.
 */
const updateArticle = async (req, res) => {
    try {
        const updatedArticle = await Article.findOneAndUpdate(
            { _id: req.params.id, storeId: req.storeId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedArticle) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.status(200).json(updatedArticle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Delete an article.
 */
const deleteArticle = async (req, res) => {
    try {
        const deletedArticle = await Article.findOneAndDelete({ _id: req.params.id, storeId: req.storeId });
        if (!deletedArticle) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.status(200).json({ message: 'Article deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getArticles,
    getArticleBySlug,
    createArticle,
    updateArticle,
    deleteArticle
};
