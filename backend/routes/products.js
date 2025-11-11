const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const {
    getProducts,
    searchProducts,
    getProductById,
    createProduct,
    updateProduct,
    updateProductVariant,
    deleteProduct
} = require('../controllers/productController');


router.get('/', asyncHandler(getProducts));


router.get('/search', asyncHandler(searchProducts));


router.get('/:id', asyncHandler(getProductById));


router.post('/', asyncHandler(createProduct));


router.put('/:id', protect, admin, asyncHandler(updateProduct));


router.put('/:productId/variants/:variantId', protect, admin, asyncHandler(updateProductVariant));


router.delete('/:id', protect, admin, asyncHandler(deleteProduct));

module.exports = router;

