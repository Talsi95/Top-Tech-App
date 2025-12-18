const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const {
    createCategory,
    updateCategory,
    deleteCategory,
    getCategories,
    getAdminCategoriesData
} = require('../controllers/categoryController');

router.get('/admin-data', protect, asyncHandler(getAdminCategoriesData));

router.get('/', asyncHandler(getCategories));

router.post('/', protect, admin, asyncHandler(createCategory));

router.put('/:id', protect, admin, asyncHandler(updateCategory));

router.delete('/:id', protect, admin, asyncHandler(deleteCategory));

module.exports = router;