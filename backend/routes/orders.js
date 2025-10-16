const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const { protect } = require('../middleware/authMiddleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/', protect, async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod, totalPrice, paymentToken } = req.body;

    if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    let isPaid = false;
    let paymentResult = {};
    const amountInCents = Math.round(totalPrice * 100);

    try {
        for (const item of orderItems) {
            const product = await Product.findById(item.product);

            if (!product) {
                throw new Error(`Product not found: ${item.product}`);
            }

            const variant = product.variants.find(v => v._id.toString() === item.variant);

            if (!variant) {
                throw new Error(`Variant not found for product: ${item.product}`);
            }

            if (variant.stock < item.quantity) {
                throw new Error(`Not enough stock for ${product.name}, requested: ${item.quantity}, available: ${variant.stock}`);
            }

            variant.stock -= item.quantity;
        }

        if (paymentMethod === 'credit-card' && paymentToken) {

            const charge = await stripe.charges.create({
                amount: amountInCents,
                currency: 'ils',
                source: paymentToken,
                description: `Order from user ${req.user.id}`,
                metadata: {
                    user_id: req.user.id,
                    order_total: totalPrice.toFixed(2)
                }
            });

            isPaid = true;
            paymentResult = {
                id: charge.id,
                status: charge.status,
                update_time: charge.created,
                email_address: req.user.email || 'N/A'
            };

        } else if (paymentMethod === 'credit-card' && !paymentToken) {
            throw new Error("Missing payment token for credit card transaction.");
        }

        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            const variant = product.variants.find(v => v._id.toString() === item.variant);
            if (variant) {
                await product.save();
            }
        }


        const order = new Order({
            user: req.user.id,
            orderItems,
            shippingAddress,
            paymentMethod,
            totalPrice,
            isPaid: isPaid,
            paidAt: isPaid ? Date.now() : null,
            paymentResult: paymentResult
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);

    } catch (err) {
        const statusCode = (err.message.includes('not enough stock') || err.message.includes('not found') || err.message.includes('token')) ? 400 : 500;
        console.error(`Order processing failed: ${err.message}`);
        res.status(statusCode).json({ message: err.message });
    }
});

module.exports = router;