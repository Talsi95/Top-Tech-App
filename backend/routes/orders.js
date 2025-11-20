const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const { createOrder, getAllOrders, getNewOrders, guestOrder, markOrderAsSeen } = require('../controllers/orderController');


router.post('/', protect, asyncHandler(createOrder));


router.get('/', protect, admin, asyncHandler(getAllOrders));

router.get('/new', protect, admin, asyncHandler(getNewOrders));

router.get('/:orderId', protect, asyncHandler(guestOrder));


router.patch('/:id/seen', protect, admin, asyncHandler(markOrderAsSeen));


module.exports = router;

