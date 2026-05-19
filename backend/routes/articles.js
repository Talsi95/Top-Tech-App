const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const {
    getArticles,
    getArticleBySlug,
    createArticle,
    updateArticle,
    deleteArticle
} = require('../controllers/articleController');

// Public routes for fetching articles
router.get('/', asyncHandler(getArticles));
router.get('/:slug', asyncHandler(getArticleBySlug));

// Admin routes for managing articles
router.post('/', protect, admin, asyncHandler(createArticle));
router.put('/:id', protect, admin, asyncHandler(updateArticle));
router.delete('/:id', protect, admin, asyncHandler(deleteArticle));

module.exports = router;
