const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const { createOrder, getAllOrders, getNewOrders, getOrderDetails, markOrderAsSeen, cancelOrder, updateOrderToDelivered, confirmHypPayment } = require('../controllers/orderController');


router.post('/', protect, asyncHandler(createOrder));


router.get('/', protect, admin, asyncHandler(getAllOrders));

router.get('/new', protect, admin, asyncHandler(getNewOrders));

router.get('/:orderId', protect, asyncHandler(getOrderDetails));

router.patch('/:id/seen', protect, admin, asyncHandler(markOrderAsSeen));

router.patch('/:id/cancel', protect, asyncHandler(cancelOrder));

router.patch('/:id/deliver', protect, admin, asyncHandler(updateOrderToDelivered));


module.exports = router;
