const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        for (const item of orderItems) {
            const product = await Product.findById(item.product);

            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.product}` });
            }

            const variant = product.variants.find(v => v._id.toString() === item.variant);

            if (!variant) {
                return res.status(404).json({ message: `Variant not found for product: ${item.product}` });
            }

            if (variant.stock < item.quantity) {
                return res.status(400).json({
                    message: `Not enough stock for ${product.name}, requested: ${item.quantity}, available: ${variant.stock}`
                });
            }

            variant.stock -= item.quantity;
            await product.save();
        }

        const order = new Order({
            user: req.user.id,
            orderItems,
            shippingAddress,
            paymentMethod,
            totalPrice
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);

    } catch (err) {
        res.status(500).json({ message: `Server error: ${err.message}` });
    }
});

module.exports = router;