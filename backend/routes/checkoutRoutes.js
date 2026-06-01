const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { applyCoupon } = require('../controllers/couponController');

// Apply coupon to checkout cartItems (open endpoint to both guests and logged-in users)
router.post('/apply-coupon', asyncHandler(applyCoupon));

module.exports = router;
