const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCart, updateCart } = require('../controllers/cartController');
const asyncHandler = require('../middleware/asyncHandler');

router.get('/', protect, asyncHandler(getCart));

router.post('/', protect, asyncHandler(updateCart));

module.exports = router;