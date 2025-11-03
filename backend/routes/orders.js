const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { protect, admin } = require('../middleware/authMiddleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const rollbackStock = async (orderItems) => {
    console.log("Starting stock rollback...");
    for (const item of orderItems) {
        try {
            const product = await Product.findById(item.product);
            if (product) {
                const variant = product.variants.find(v => v._id.toString() === item.variant);
                if (variant) {
                    variant.stock += item.quantity;
                    await product.save();
                }
            }
        } catch (rollbackError) {
            console.error(`ERROR DURING ROLLBACK for product ${item.product}: ${rollbackError.message}`);
        }
    }
    console.log("Stock rollback complete.");
};


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
                throw new Error(`Variant not found for product: ${product.name}`);
            }

            if (variant.stock < item.quantity) {
                throw new Error(`Not enough stock for ${product.name}, requested: ${item.quantity}, available: ${variant.stock}`);
            }
            variant.stock -= item.quantity;
            await product.save();
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

        const userEmail = req.user ? req.user.email : 'N/A';
        console.log(`DEBUG: Attempting to send confirmation email to: ${userEmail}`);

        try {
            if (req.user && req.user.email) {
                await sendOrderConfirmationEmail(req.user.email, {
                    ...createdOrder.toObject(),
                    orderItems: orderItems
                });
            } else {
                console.warn("WARNING: Skipping email confirmation because req.user.email is missing.");
            }
        } catch (emailError) {
            console.error(`Warning: Order ${createdOrder._id} saved, but confirmation email failed to send: ${emailError.message}`);
        }


        res.status(201).json(createdOrder);

    } catch (err) {
        if (paymentMethod === 'credit-card' && err.type === 'StripeCardError' || err.type === 'StripeInvalidRequestError' || err.message.includes('token')) {
            console.log("Payment failed. Initiating stock rollback.");
            await rollbackStock(orderItems);
        } else if (err.message.includes('stock') || err.message.includes('not found')) {
            console.log("Validation failure. No rollback needed.");
        }

        const statusCode = (err.message.includes('stock') || err.message.includes('not found') || err.message.includes('token') || err.type) ? 400 : 500;

        console.error(`Order processing failed: ${err.message}`);
        res.status(statusCode).json({ message: err.message });
    }
});

router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'username email')
            .populate({
                path: 'orderItems.product',
                model: 'Product',
            })
            .sort({ createdAt: -1 });

        const sanitizedOrders = orders.map(order => {
            const sanitizedItems = order.orderItems.filter(item => item.product !== null);
            return {
                ...order.toObject(),
                orderItems: sanitizedItems
            };
        });

        res.status(200).json(sanitizedOrders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch all orders' });
    }
});

router.get('/new', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({ isUnseen: true })
            .populate('user', 'username email')
            .select('_id totalPrice createdAt user')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch new orders' });
    }
});

router.patch('/:id/seen', protect, admin, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { isUnseen: false },
            { new: true }
        );

        if (order) {
            res.json({ message: 'Order marked as seen', orderId: req.params.id });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Failed to update order status' });
    }
});

module.exports = router;