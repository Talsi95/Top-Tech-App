const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const {
    getCoupons,
    createCoupon,
    updateCoupon,
    toggleCouponActive,
    deleteCoupon
} = require('../controllers/couponController');

// Apply protection to all coupon management routes
router.use(protect);
router.use(admin);

// Admin Coupon CRUD and state management endpoints
router.get('/', asyncHandler(getCoupons));
router.post('/', asyncHandler(createCoupon));
router.put('/:id', asyncHandler(updateCoupon));
router.patch('/:id/toggle', asyncHandler(toggleCouponActive));
router.delete('/:id', asyncHandler(deleteCoupon));

module.exports = router;
