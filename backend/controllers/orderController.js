const Order = require('../models/order');
const Product = require('../models/product');
const Otp = require('../models/otp');
const GuestUser = require('../models/guestUser');
const { sendOrderConfirmationEmail } = require('../services/emailService');
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


const createOrder = async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod, totalPrice, paymentToken } = req.body;

    if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    let isPaid = false;
    let paymentResult = {};
    const amountInCents = Math.round(totalPrice * 100);

    let userId = null;
    let contactIdentifier = null;
    let finalShippingAddress = shippingAddress;
    let guestTokenToStore = null;
    let isGuestOrder = false;

    if (req.user && !req.user.isGuest) {
        userId = req.user.id;
        contactIdentifier = req.user.email;
    } else if (req.user && req.user.isGuest) {
        isGuestOrder = true;
        contactIdentifier = finalShippingAddress.email || finalShippingAddress.phone;
        guestTokenToStore = req.user.token;
    } else {
        return res.status(401).json({ message: 'נדרשת התחברות או אימות אורח כדי להמשיך לקופה.' });
    }

    try {
        const productIds = orderItems.map(item => item.product);
        const uniqueProductIds = [...new Set(productIds)];

        const products = await Product.find({
            _id: { $in: uniqueProductIds }
        }).select('variants name');

        const productMap = products.reduce((acc, product) => {
            acc[product._id.toString()] = product;
            return acc;
        }, {});

        const orderItemsWithPrice = [];

        for (const item of orderItems) {
            const product = productMap[item.product];

            if (!product) {
                throw new Error(`Product not found: ${item.product}`);
            }

            const variant = product.variants.find(v => v._id?.toString() === item.variant);

            if (!variant) {
                throw new Error(`Variant not found for product: ${product.name}`);
            }

            if (variant.stock < item.quantity) {
                throw new Error(`Not enough stock for ${product.name}, requested: ${item.quantity}, available: ${variant.stock}`);
            }

            const unitPrice = (variant.isOnSale && variant.salePrice && variant.salePrice > 0)
                ? variant.salePrice
                : variant.price;

            variant.stock -= item.quantity;

            orderItemsWithPrice.push({
                product: item.product,
                variant: item.variant,
                quantity: item.quantity,
                price: unitPrice
            });
        }

        await Promise.all(
            Object.values(productMap).map(p => p.save())
        );


        if (paymentMethod === 'credit-card' && paymentToken) {
            const charge = await stripe.charges.create({
                amount: amountInCents,
                currency: 'ils',
                source: paymentToken,
                description: `Order from ${userId ? 'user' : 'guest'} ${userId || contactIdentifier}`,
                metadata: {
                    user_id: userId || 'Guest',
                    order_total: totalPrice.toFixed(2)
                }
            });

            isPaid = true;
            paymentResult = {
                id: charge.id,
                status: charge.status,
                update_time: charge.created,
                email_address: contactIdentifier || 'N/A'
            };

        } else if (paymentMethod === 'credit-card' && !paymentToken) {
            throw new Error("Missing payment token for credit card transaction.");
        }

        const order = new Order({
            user: userId,
            isGuestOrder: isGuestOrder,
            guestToken: guestTokenToStore,
            orderItems: orderItemsWithPrice,
            shippingAddress: finalShippingAddress,
            paymentMethod,
            totalPrice,
            isPaid: isPaid,
            paidAt: isPaid ? Date.now() : null,
            paymentResult: paymentResult
        });

        const createdOrder = await order.save();

        console.log(`DEBUG: Attempting to send confirmation email to: ${contactIdentifier}`);

        try {
            if (contactIdentifier) {
                await sendOrderConfirmationEmail(contactIdentifier, createdOrder.toObject());
            } else {
                console.warn("WARNING: Skipping email confirmation because identifier is missing.");
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
};

const getAllOrders = async (req, res) => {
    const orders = await Order.find({})
        .populate('user', 'username email')
        .populate({
            path: 'orderItems.product',
            model: 'Product',
            select: 'name variants',
        })
        .sort({ createdAt: -1 });

    const sanitizedOrders = orders.map(order => {
        const sanitizedItems = order.orderItems.filter(item => item.product !== null);

        let userInfo = {};
        if (order.user) {
            userInfo = { username: order.user.username, email: order.user.email, id: order.user._id };
        } else if (order.isGuestOrder) {
            userInfo = {
                username: order.shippingAddress?.fullName || 'אורח',
                email: order.shippingAddress?.phone || order.paymentResult?.email_address || 'לא ידוע',
                id: 'Guest'
            };
        } else {
            userInfo = { username: 'לא ידוע', email: 'לא ידוע', id: 'N/A' };
        }
        return {
            ...order.toObject(),
            orderItems: sanitizedItems,
            userInfo: userInfo
        };
    });

    res.status(200).json(sanitizedOrders);
};

const guestOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const order = await Order.findById(orderId)
            .populate('orderItems.product', 'name price imageUrl')
            .lean();

        if (!order) {
            return res.status(404).json({ message: 'הזמנה לא נמצאה.' });
        }

        const isGuest = req.user.isGuest === true;
        const tokenFromHeader = req.user.token;

        if (isGuest) {
            if (!order.guestToken || order.guestToken !== tokenFromHeader) {
                return res.status(403).json({ message: 'אין הרשאה לצפות בהזמנה זו.' });
            }
        }

        res.status(200).json(order);

    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'שגיאת שרת באחזור פרטי ההזמנה.' });
    }
};

const getNewOrders = async (req, res) => {

    const orders = await Order.find({ isUnseen: true })
        .populate('user', 'username email')
        .populate({
            path: 'orderItems.product',
            model: 'Product',
            select: 'name variants'
        })
        .select('_id totalPrice createdAt user orderItems isGuestOrder paymentResult shippingAddress')
        .sort({ createdAt: -1 });

    const sanitizedOrders = orders.map(order => {
        let userInfo = {};
        const shippingAddress = order.shippingAddress;
        if (order.user) {
            userInfo = { username: order.user.username, email: order.user.email, id: order.user._id };
        } else if (order.isGuestOrder) {

            if (shippingAddress) {
                userInfo = {
                    username: shippingAddress.fullName || 'אורח',
                    email: shippingAddress.email || shippingAddress.phone || order.paymentResult?.email_address || 'לא ידוע',
                    id: 'Guest'
                };
            } else {
                userInfo = { username: 'אורח', email: 'חסר כתובת', id: 'Guest' };
            }

        } else {
            userInfo = { username: 'לא ידוע', email: 'לא ידוע', id: 'N/A' };
        }

        const sanitizedItems = order.orderItems.filter(item => item.product !== null);

        return {
            ...order.toObject(),
            orderItems: sanitizedItems,
            userInfo: userInfo
        };
    });


    res.status(200).json(sanitizedOrders);
};

const markOrderAsSeen = async (req, res) => {
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
};

module.exports = {
    createOrder,
    getAllOrders,
    getNewOrders,
    guestOrder,
    markOrderAsSeen
};