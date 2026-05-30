const Order = require('../models/order');
const Product = require('../models/product');
const mongoose = require('mongoose');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

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
        let calculatedSubtotal = 0;

        for (const item of orderItems) {
            const product = productMap[item.product];

            if (!product) {
                throw new Error(`המוצר לא נמצא במערכת: ${item.product}`);
            }

            const variant = product.variants.find(v => v._id?.toString() === item.variant);

            if (!variant) {
                throw new Error(`הוריאציה לא נמצאה עבור המוצר: ${product.name}`);
            }

            if (shouldCheckStock && variant.stock < item.quantity) {
                throw new Error(`אין מספיק מלאי עבור המוצר ${product.name}. מלאי זמין: ${variant.stock}`);
            }

            // Recalculate base price of the variant
            const dbUnitPrice = (variant.isOnSale && variant.salePrice && variant.salePrice > 0)
                ? variant.salePrice
                : variant.price;

            // Recalculate option price additions from the DB
            let dbOptionsTotal = 0;
            if (item.selectedOptions && Array.isArray(item.selectedOptions)) {
                for (const selectedOpt of item.selectedOptions) {
                    const dbOpt = product.options.find(o => o.name === selectedOpt.name);
                    if (dbOpt) {
                        const dbChoice = dbOpt.choices.find(c => c.name === selectedOpt.choice);
                        if (dbChoice) {
                            dbOptionsTotal += (dbChoice.priceAddition || 0);
                        }
                    }
                }
            }

            const dbItemTotalPrice = dbUnitPrice + dbOptionsTotal;

            // Verify if the price sent by client matches the DB price
            if (Math.abs(item.price - dbItemTotalPrice) > 0.01) {
                throw new Error(`המחיר של המוצר "${product.name}" השתנה. אנא עדכן את העגלה ונסה שנית.`);
            }

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
                price: dbItemTotalPrice // Save correct full price (base + options)
            });

            calculatedSubtotal += dbItemTotalPrice * item.quantity;
        }

        // Validate shipping price
        let dbShippingPrice = 0;
        if (req.store?.shippingOptions && req.store.shippingOptions.length > 0) {
            const selectedOpt = req.store.shippingOptions.find(opt => opt.name === shippingMethod);
            dbShippingPrice = selectedOpt ? selectedOpt.price : (req.store.shippingOptions[0]?.price || 0);
        } else {
            switch (shippingMethod) {
                case 'home-delivery':
                    dbShippingPrice = 29;
                    break;
                case 'pickup-point':
                    dbShippingPrice = 15;
                    break;
                default:
                    dbShippingPrice = 0;
            }
        }

        if (Math.abs(shippingPrice - dbShippingPrice) > 0.01) {
            throw new Error('עלות המשלוח אינה תואמת להגדרות החנות העדכניות. אנא נסה שוב.');
        }

        // Verify overall total price
        const calculatedTotal = calculatedSubtotal + dbShippingPrice;
        if (Math.abs(totalPrice - calculatedTotal) > 0.01) {
            throw new Error('סכום ההזמנה אינו תואם למחיר העדכני של המוצרים. אנא רענן את העגלה ונסה שוב.');
        }

        await Promise.all(
            Object.values(productMap).map(p => p.save())
        );

        const orderId = new mongoose.Types.ObjectId();

        const order = new Order({
            _id: orderId,
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

        if (paymentMethod === 'credit-card') {
            const paymentSettings = req.store?.paymentSettings;
            const { dirName, username } = paymentSettings?.hyp || {};

            const { password, apiKey } = req.store.getDecryptedHypCredentials();

            if (!dirName || !username || !password || !apiKey) {
                throw new Error("פרטי מסוף ה-Hyp של החנות חסרים או לא הוגדרו כראוי במערכת.");
            }

            const hypApiUrl = 'https://pay.hyp.co.il/p/';
            const storeSlug = req.store.slug || 'default';

            const successUrl = `${req.headers.origin}/store/${storeSlug}/order-confirmation/${orderId}?status=success&CCode=0`;
            const failureUrl = `${req.headers.origin}/store/${storeSlug}/checkout?status=failed&orderId=${orderId}`;

            const payload = {
                action: 'APISign',
                What: 'SIGN',
                Sign: 'True',
                Masof: dirName,
                KEY: apiKey,
                PassP: password,
                Amount: totalPrice.toString(),
                Order: orderId.toString(),
                Coin: '1',
                PageLang: 'HEB',
                UTF8: 'True',
                success_url: successUrl,
                error_url: failureUrl
            };

            const params = new URLSearchParams(payload);
            const hypResponse = await axios.get(`${hypApiUrl}?${params.toString()}`);
            const responseData = hypResponse.data;

            if (responseData && responseData.includes('signature=')) {
                const paymentPageUrl = `${hypApiUrl}?${responseData}`;

                await order.save();

                return res.status(201).json({
                    forwardToPayment: true,
                    paymentUrl: paymentPageUrl
                });
            } else {
                throw new Error(`שרת הסליקה דחה את הפקת החתימה. תגובה: ${responseData}`);
            }
        }

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

        const currentPaymentMethod = req.body?.paymentMethod;

        if (shouldCheckStock && currentPaymentMethod === 'credit-card') {
            console.log("Payment flow failed or interrupted. Initiating stock rollback.");
            if (req.body?.orderItems) await rollbackStock(req.body.orderItems);
        } else if (err.message.includes('stock') || err.message.includes('not found')) {
            console.log("Validation failure. No rollback needed.");
        }

        const statusCode = (err.message.includes('stock') || err.message.includes('not found') || err.message.includes('token') || err.type || err.isAxiosError) ? 400 : 500;

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

        const query = {
            storeId: req.storeId,
            $or: [
                { paymentMethod: { $ne: 'credit-card' } },
                { isPaid: true }
            ]
        };

        const totalOrders = await Order.countDocuments(query);
        const orders = await Order.find(query)
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
        const { status, CCode } = req.query;

        const order = await Order.findOne({ _id: orderId, storeId: req.storeId })
            .populate('orderItems.product', 'name price imageUrl variants');

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

        if (order.paymentMethod === 'credit-card' && !order.isPaid && status === 'success' && CCode === '0') {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.isUnseen = true;

            await order.save();

            if (order.shippingAddress?.email) {
                try {
                    const populatedOrder = await Order.findById(order._id).populate('orderItems.product');
                    await sendOrderConfirmationEmail(order.shippingAddress.email, populatedOrder.toObject(), req.store);
                } catch (e) {
                    console.error("Email failed", e.message);
                }
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

    const query = {
        storeId: req.storeId,
        isUnseen: true,
        $or: [
            { paymentMethod: { $ne: 'credit-card' } },
            { isPaid: true }
        ]
    };

    const orders = await Order.find(query)
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