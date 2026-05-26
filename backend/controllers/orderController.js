const Order = require('../models/order');
const Product = require('../models/product');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Rolls back stock levels for items in a failed order.
 * @param {Array} orderItems - List of items in the order.
 */
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


/**
 * Creates a new order, handles payment (via Stripe), and updates stock levels.
 * Supports registered users and guest orders (via token or OTP).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createOrder = async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        totalPrice,
        paymentToken,
        shippingMethod,
        shippingPrice,
        otpCode,
        phone
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    let isPaid = false;
    let paymentResult = {};
    const amountInCents = Math.round(totalPrice * 100);

    let userId = null;
    let finalEmail;
    let finalPhone;
    let isGuestOrder = false;

    if (req.user) {
        if (req.user.isGuest) {
            isGuestOrder = true;
            finalEmail = req.user.email;
            finalPhone = req.user.phone;
        } else {
            userId = req.user._id;
            finalEmail = req.user.email;
            finalPhone = shippingAddress.phone;
        }
    } else {
        return res.status(401).json({ message: 'נדרשת התחברות או אימות אורח כדי להמשיך.' });
    }

    try {
        const shouldCheckStock = req.store?.features?.showStock !== false;

        const storeName = req.store?.name || 'החנות שלנו';
        const productIds = orderItems.map(item => item.product);
        const uniqueProductIds = [...new Set(productIds)];

        const products = await Product.find({
            _id: { $in: uniqueProductIds },
            storeId: req.storeId
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

            if (shouldCheckStock && variant.stock < item.quantity) {
                throw new Error(`Not enough stock for ${product.name}, requested: ${item.quantity}, available: ${variant.stock}`);
            }

            const unitPrice = (variant.isOnSale && variant.salePrice && variant.salePrice > 0)
                ? variant.salePrice
                : variant.price;

            // Extract variant attributes (excluding standard system fields)
            const standardFields = ['price', 'stock', 'imageUrl', 'imageUrls', 'isOnSale', 'salePrice', '_id', 'id', 'attributes', '__v'];
            const variantObj = variant.toObject ? variant.toObject() : variant;
            const attributes = new Map();
            Object.keys(variantObj).forEach(key => {
                if (!standardFields.includes(key)) {
                    attributes.set(key, String(variantObj[key]));
                }
            });

            if (shouldCheckStock) {
                variant.stock -= item.quantity;
            }

            orderItemsWithPrice.push({
                product: item.product,
                variant: item.variant,
                attributes: attributes,
                selectedOptions: item.selectedOptions || [],
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
                description: `Order from ${userId ? 'user' : 'guest'} ${userId || finalEmail}`,
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
                email_address: finalEmail || 'N/A'
            };

        } else if (paymentMethod === 'credit-card' && !paymentToken) {
            throw new Error("Missing payment token for credit card transaction.");
        }

        const order = new Order({
            storeId: req.storeId,
            user: userId,
            isGuestOrder: isGuestOrder,
            guestToken: isGuestOrder ? req.user.token : null,
            orderItems: orderItemsWithPrice,
            shippingAddress: {
                ...shippingAddress,
                email: finalEmail,
                phone: finalPhone
            },
            shippingMethod,
            shippingPrice,
            paymentMethod,
            totalPrice,
            isPaid: isPaid,
            paidAt: isPaid ? Date.now() : null,
            paymentResult: paymentResult
        });

        const createdOrder = await order.save();

        console.log(`DEBUG: Attempting to send confirmation email to: ${finalEmail}`);

        try {
            if (finalEmail) {
                const populatedOrder = await Order.findById(createdOrder._id).populate('orderItems.product');
                await sendOrderConfirmationEmail(finalEmail, populatedOrder.toObject(), req.store);
            } else {
                console.warn("WARNING: Skipping email confirmation because finalEmail is missing.");
            }
        } catch (emailError) {
            console.error(`Warning: Order ${createdOrder._id} saved, but confirmation email failed to send: ${emailError.message}`);
        }

        res.status(201).json(createdOrder);

    } catch (err) {
        const shouldCheckStock = req.store?.features?.showStock !== false;

        if (shouldCheckStock && (paymentMethod === 'credit-card' && err.type === 'StripeCardError' || err.type === 'StripeInvalidRequestError' || err.message.includes('token'))) {
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

/**
 * Fetches all orders from the database (admin only).
 * Supports pagination via query parameters.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments({ storeId: req.storeId });
        const orders = await Order.find({ storeId: req.storeId })
            .populate('user', 'username email')
            .populate({
                path: 'orderItems.product',
                model: 'Product',
                select: 'name variants',
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

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

        res.status(200).json({
            orders: sanitizedOrders,
            hasMore: totalOrders > skip + orders.length
        });
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'שגיאה באחזור הזמנות' });
    }
};

/**
 * Fetches details for a specific guest order by ID.
 * Verifies that the guest token matches.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const guestOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const order = await Order.findOne({ _id: orderId, storeId: req.storeId })
            .populate('orderItems.product', 'name price imageUrl variants')
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

/**
 * Fetches new (unseen) orders for the admin dashboard.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getNewOrders = async (req, res) => {

    const orders = await Order.find({ isUnseen: true, storeId: req.storeId })
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

/**
 * Marks a specific order as seen by the admin.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const markOrderAsSeen = async (req, res) => {
    const order = await Order.findOneAndUpdate(
        { _id: req.params.id, storeId: req.storeId },
        { isUnseen: false },
        { new: true }
    );

    if (order) {
        res.json({ message: 'Order marked as seen', orderId: req.params.id });
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

/**
 * Cancels an order if it hasn't been delivered yet.
 * Rollbacks stock levels for the cancelled items.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const cancelOrder = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, storeId: req.storeId });

    if (order) {
        // Check if the order belongs to the user
        const isOwner = req.user._id && order.user && order.user.toString() === req.user._id.toString();

        if (!isOwner) {
            return res.status(403).json({ message: 'אין הרשאה לבטל הזמנה זו.' });
        }

        if (order.isDelivered) {
            return res.status(400).json({ message: 'לא ניתן לבטל הזמנה שכבר נשלחה.' });
        }

        if (order.isCancelled) {
            return res.status(400).json({ message: 'ההזמנה כבר בוטלה.' });
        }

        order.isCancelled = true;
        order.cancelledAt = Date.now();

        const cancelledOrder = await order.save();

        // Rollback stock levels if stock feature is active
        const shouldCheckStock = req.store?.features?.showStock !== false;
        if (shouldCheckStock) {
            await rollbackStock(order.orderItems);
        }

        res.json({ message: 'ההזמנה בוטלה בהצלחה', order: cancelledOrder });
    } else {
        res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }
};

/**
 * Updates an order status to delivered (admin only).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateOrderToDelivered = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, storeId: req.storeId });

    if (order) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getNewOrders,
    guestOrder,
    markOrderAsSeen,
    cancelOrder,
    updateOrderToDelivered
};