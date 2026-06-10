const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const {
    getProducts,
    getUniqueSubcategories,
    searchProducts,
    getProductById,
    createProduct,
    updateProduct,
    updateProductVariant,
    deleteProduct,
    uploadVideo,
    deleteVideoFromCloudinary
} = require('../controllers/productController');
const { upload: importUpload, importProducts, getImportStatus } = require('../controllers/productImportController');


router.get('/', asyncHandler(getProducts));

router.get('/subcategories/unique', asyncHandler(getUniqueSubcategories));


router.get('/search', asyncHandler(searchProducts));


router.get('/:id', asyncHandler(getProductById));


router.post('/', asyncHandler(createProduct));
router.post('/upload-video', protect, admin, upload.single('video'), asyncHandler(uploadVideo));
router.post('/delete-video', protect, admin, asyncHandler(deleteVideoFromCloudinary));
router.post('/import', protect, admin, importUpload.single('file'), asyncHandler(importProducts));
router.get('/import/status/:jobId', protect, admin, asyncHandler(getImportStatus));



router.put('/:id', protect, admin, asyncHandler(updateProduct));


router.put('/:productId/variants/:variantId', protect, admin, asyncHandler(updateProductVariant));


router.delete('/:id', protect, admin, asyncHandler(deleteProduct));

module.exports = router;

