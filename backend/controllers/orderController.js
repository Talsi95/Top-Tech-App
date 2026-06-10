const Order = require('../models/order');
const Product = require('../models/product');
const mongoose = require('mongoose');
const { sendOrderConfirmationEmail, sendOrderReadyEmail } = require('../services/emailService');
const { sendInvoice } = require('../services/invoiceService');
const { sendOrderDeliveredSMS } = require('../services/smsService');
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
 * Deducts stock levels for items in a successful order.
 * @param {Array} orderItems - List of items in the order.
 */
const deductStock = async (orderItems) => {
    console.log("Starting stock deduction...");
    for (const item of orderItems) {
        try {
            const product = await Product.findById(item.product);
            if (product) {
                const variant = product.variants.find(v => v._id.toString() === item.variant);
                if (variant) {
                    variant.stock -= item.quantity;
                    await product.save();
                    console.log(`Deducted ${item.quantity} from product ${product.name} (variant ${item.variant}). New stock: ${variant.stock}`);
                }
            }
        } catch (deductError) {
            console.error(`ERROR DURING DEDUCTION for product ${item.product}: ${deductError.message}`);
        }
    }
    console.log("Stock deduction complete.");
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
        phone,
        saveCard
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    if (paymentMethod === 'cash' && req.store?.features?.hasCashPayment === false) {
        return res.status(400).json({ message: 'תשלום במזומן אינו מאופשר בחנות זו. אנא בחר שיטת תשלום אחרת.' });
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
        }).select('variants name options');

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

            if (shouldCheckStock && paymentMethod !== 'credit-card') {
                variant.stock -= item.quantity;
            }

            orderItemsWithPrice.push({
                product: item.product,
                name: product.name,
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

        if (paymentMethod !== 'credit-card') {
            await Promise.all(
                Object.values(productMap).map(p => p.save())
            );
        }

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
            const activeProvider = paymentSettings?.provider;
            if (!activeProvider || activeProvider === 'none') {
                throw new Error("לא הוגדרה חברת סליקה פעילה עבור חנות זו.");
            }
            if (activeProvider === 'hyp') {
                const { dirName, username, autoInvoice, isEnterprise, isSandbox } = paymentSettings?.hyp || {};
                const { password, apiKey } = req.store.getDecryptedHypCredentials();

                if (!dirName || !username || !password || !apiKey) {
                    throw new Error("פרטי מסוף ה-Hyp של החנות חסרים או לא הוגדרו כראוי במערכת.");
                }

                const storeSlug = req.store.slug || 'default';
                const successUrl = `${req.headers.origin}/store/${storeSlug}/order-confirmation/${orderId}?status=success`;
                const errorUrl = `${req.headers.origin}/store/${storeSlug}/checkout?status=failed&orderId=${orderId}`;
                const cancelUrl = `${req.headers.origin}/store/${storeSlug}/checkout?status=cancelled&orderId=${orderId}`;

                let paymentPageUrl = '';
                
                const HypToken = require('../models/hypToken');
                
                const uiCustomData = {
                    redirectTargetParent: true,
                    customStyle: ":root { --primary-color: #3a45d9; --secondary-color: #1f2937; --primary-contrast-color: #ffffff; --secondary-contrast-color: #ffffff; } #cg-submit-btn { background-color: #3a45d9; border-color: #3a45d9; color: #ffffff; border-radius: 8px; font-weight: 700; } #cg-submit-btn:hover { opacity: 0.9; } .cg-input:focus { border-color: #3a45d9; box-shadow: 0 0 0 3px #3a45d933; } a { color: #3a45d9; } #logo-icon { display: none; }",
                    customText: {
                        "cg-pd-title": `תשלום ל${req.store.name || "החנות שלי"}`,
                        "cg-form-title": "פרטי תשלום",
                        "cg-submit-btn": `שלם ₪${totalPrice.toFixed(2)}`,
                        "label-card-number": "מספר כרטיס אשראי",
                        "label-expYear": "שנה",
                        "label-expMonth": "חודש",
                        "label-cvv": "CVV",
                        "label-card-id": "ת.ז. / תעודת עולה",
                        "cg-cancel-btn": "ביטול",
                        "label-card-holder-name": "שם בעל הכרטיס",
                        "cg-wallet-pay": "שלם באמצעות ארנק דיגיטלי",
                        "cg-google-pay-btn": "Google Pay",
                        "cg-apple-pay-btn": "Apple Pay",
                        "cg-bit-btn": "Pay with bit",
                        "label-bit-name": "שם מלא (bit)",
                        "label-bit-phone": "מספר טלפון (bit)"
                    }
                };

                const ppsConfig = {
                    frameAncestorURLs: process.env.FRONTEND_URL || 'http://localhost:5173',
                    uiCustomData: uiCustomData
                };

                if (req.body.paymentTokenId) {
                    const tokenDoc = await HypToken.findOne({
                        _id: req.body.paymentTokenId,
                        storeId: req.storeId,
                        active: true
                    });
                    
                    if (!tokenDoc) {
                        throw new Error("כרטיס שמור לא נמצא או אינו פעיל.");
                    }

                    const tokefYYMM = tokenDoc.tokef || "";
                    let cardExpMMYY = tokefYYMM;
                    if (tokefYYMM.length === 4) {
                        cardExpMMYY = tokefYYMM.substring(2, 4) + tokefYYMM.substring(0, 2);
                    }

                    ppsConfig.uiCustomData.paymentMethods = [
                        {
                            type: "token",
                            token: tokenDoc.token,
                            cardExpiration: cardExpMMYY,
                            autoSubmit: true
                        }
                    ];
                    ppsConfig.uiCustomData.skipPaymentMethodsScreen = true;
                }

                if (isEnterprise === true) {
                    const cgRelayUrl = isSandbox !== false 
                        ? 'https://cguat2.creditguard.co.il/xpo/Relay' 
                        : 'https://cg.pay.co.il/xpo/Relay';

                    const amountInCents = Math.round(totalPrice * 100);

                    let xmlPayload = `
<ashrait>
    <request>
        <command>doDeal</command>
        <requestId></requestId>
        <version>2000</version>
        <language>HEB</language>
        <doDeal>
            <terminalNumber>${dirName}</terminalNumber>
            <cardNo>CGMPI</cardNo>
            <total>${amountInCents}</total>
            <transactionType>Debit</transactionType>
            <creditType>RegularCredit</creditType>
            <currency>ILS</currency>
            <transactionCode>Internet</transactionCode>
            <validation>TxnSetup</validation>
            <mid>${apiKey}</mid>
            <uniqueid>${orderId}</uniqueid>
            <mpiValidation>AutoComm</mpiValidation>
            <successUrl>${successUrl}</successUrl>
            <errorUrl>${errorUrl}</errorUrl>
            <cancelUrl>${cancelUrl}</cancelUrl>
            <user>${username}</user>
            <password>${password}</password>
            <ppsJSONConfig><![CDATA[${JSON.stringify(ppsConfig)}]]></ppsJSONConfig>
        </doDeal>
    </request>
</ashrait>`;

                    const params = new URLSearchParams({ int_in: xmlPayload.trim() });

                    const hypResponse = await axios.post(cgRelayUrl, params.toString(), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });

                    const { XMLParser } = require('fast-xml-parser');
                    const parser = new XMLParser();
                    const parsedResponse = parser.parse(hypResponse.data);

                    if (parsedResponse?.ashrait?.response?.result === '000') {
                        paymentPageUrl = parsedResponse.ashrait.response.doDeal.mpiHostedPageUrl;
                        if (typeof paymentPageUrl === 'string') {
                            paymentPageUrl = paymentPageUrl.trim();
                        }
                    } else {
                        const errorMsg = parsedResponse?.ashrait?.response?.userMessage || parsedResponse?.ashrait?.response?.message || hypResponse.data;
                        throw new Error(`שגיאה ביצירת דף התשלום (Enterprise). תגובת שרת: ${errorMsg}`);
                    }
                } else {
                    // Legacy Hyp Pay (Ya'ad Sarig) Flow
                    const hypApiUrl = 'https://pay.hyp.co.il/p/';

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
                        ClientName: shippingAddress?.firstName || 'לקוח',
                        ClientLName: shippingAddress?.lastName || '',
                        successUrl,
                        errorUrl,
                        cancelUrl,
                        ppsJSONConfig: JSON.stringify(ppsConfig)
                    };

                    if (saveCard === true) {
                        payload.Tkn = '1';
                    }
                    
                    if (autoInvoice === true) {
                        const itemsForInvoice = orderItemsWithPrice.map(item => {
                            const itemCode = '0';
                            const productName = item.name || 'מוצר בחנות';
                            const quantity = item.quantity;
                            const priceIncludingVat = item.price;
                            return `[${itemCode}~${productName}~${quantity}~${priceIncludingVat}]`;
                        });

                        if (shippingPrice > 0) {
                            itemsForInvoice.push(`[0~דמי משלוח~1~${shippingPrice}]`);
                        }

                        payload.Pritim = 'True';
                        payload.heshDesc = itemsForInvoice.join('');
                        payload.SendHesh = 'True';
                        payload.email = finalEmail;
                        payload['EZ.lang'] = 'he';
                    }

                    const apisignParams = new URLSearchParams(payload);
                    const hypResponse = await axios.get(`${hypApiUrl}?${apisignParams.toString()}`);
                    const responseData = hypResponse.data;

                    if (responseData && responseData.includes('signature=')) {
                        paymentPageUrl = `${hypApiUrl}?${responseData}`;
                    } else {
                        throw new Error(`שרת הסליקה דחה את הפקת החתימה. תגובה: ${responseData}`);
                    }
                }

                order.paymentResult = {
                    id: orderId.toString(),
                    provider: 'hyp',
                    status: 'pending',
                    saveCard: saveCard === true
                };

                await order.save();

                return res.status(201).json({
                    forwardToPayment: true,
                    paymentUrl: paymentPageUrl
                });
            }
            if (activeProvider === 'verifone') {
                const { username, password, entityId, paymentContractId } = paymentSettings.verifone || {};

                if (!username || !password || !entityId || !paymentContractId) {
                    throw new Error("פרטי מסוף ה-Verifone חסרים או לא הוגדרו כראוי בבסיס הנתונים.");
                }

                const verifoneApiUrl = 'https://emea.gsc.verifone.cloud/oidc/checkout-service/v2/checkout';
                const storeSlug = req.store.slug || 'default';

                const successUrl = `${req.headers.origin}/store/${storeSlug}/order-confirmation/${orderId}?status=success`;
                const failureUrl = `${req.headers.origin}/store/${storeSlug}/checkout?status=failed&orderId=${orderId}`;

                const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

                const payload = {
                    entity_id: entityId,
                    currency_code: 'ILS',
                    amount: Math.round(totalPrice * 100),
                    merchant_reference: orderId.toString(),
                    return_url: successUrl,
                    interaction_type: 'HPP',
                    receipt_type: 'FULL_RECEIPT',
                    configurations: {
                        card: {
                            mode: 'PAYMENT',
                            payment_contract_id: paymentContractId,
                            capture_now: true
                        }
                    }
                };

                try {
                    const verifoneResponse = await axios.post(verifoneApiUrl, payload, {
                        headers: {
                            'Authorization': authHeader,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (verifoneResponse.data && verifoneResponse.data.redirect_url) {

                        order.paymentResult = {
                            id: verifoneResponse.data.id || '',
                            provider: 'verifone'
                        };

                        await order.save();

                        return res.status(201).json({
                            forwardToPayment: true,
                            paymentUrl: verifoneResponse.data.redirect_url
                        });
                    } else {
                        throw new Error("לא התקבל קישור הפניה (redirect_url) משרתי Verifone.");
                    }

                } catch (verifoneErr) {
                    const errorDetails = verifoneErr.response?.data ? JSON.stringify(verifoneErr.response.data) : verifoneErr.message;
                    throw new Error(`שגיאה בהפקת סשן תשלום מול Verifone: ${errorDetails}`);
                }
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

        if (shouldCheckStock && currentPaymentMethod !== 'credit-card') {
            console.log("Order processing failed. Initiating stock rollback for non-credit-card payment.");
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
const getOrderDetails = async (req, res) => {
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

        const activePaymentProvider = req.store?.paymentSettings?.provider;

        const isHypPaid = activePaymentProvider === 'hyp' && status === 'success' && CCode === '0';
        const isVerifonePaid = activePaymentProvider === 'verifone' && status === 'success';

        if (order.paymentMethod === 'credit-card' && !order.isPaid && (isHypPaid || isVerifonePaid)) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.isUnseen = true;

            const shouldCheckStock = req.store?.features?.showStock !== false;
            if (shouldCheckStock) {
                await deductStock(order.orderItems);
            }

            await order.save();

            if (order.shippingAddress?.email) {
                try {
                    const populatedOrder = await Order.findById(order._id).populate('orderItems.product');

                    try {
                        const isEnterprise = req.store?.paymentSettings?.hyp?.isEnterprise;
                        const autoInvoice = req.store?.paymentSettings?.hyp?.autoInvoice;

                        if (activePaymentProvider === 'hyp' && isEnterprise === true && autoInvoice === true && cgUid) {
                            await sendHypEnterpriseInvoice(populatedOrder.toObject(), req.store, cgUid);
                            console.log(`[Enterprise Invoice]: Document successfully generated for order ${order._id}`);
                        } else if (activePaymentProvider !== 'hyp' || isEnterprise !== true) {
                            // Hyp Pay (Ya'ad Sarig) handles this automatically inside APISign.
                            // Only trigger sendInvoice for non-Hyp or if custom logic requires.
                            await sendInvoice(populatedOrder.toObject(), req.store);
                            console.log(`[Invoice]: Document successfully generated for order ${order._id}`);
                        }
                    } catch (invoiceErr) {
                        console.error(`[Invoice system error] for order ${order._id}:`, invoiceErr.message);
                    }

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
        // Check if the order belongs to the user or guest
        const isGuest = req.user?.isGuest === true;
        const tokenFromHeader = req.user?.token;

        let isOwner = false;
        if (isGuest) {
            isOwner = order.isGuestOrder && order.guestToken === tokenFromHeader;
        } else {
            isOwner = req.user?._id && order.user && order.user.toString() === req.user._id.toString();
        }

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

        // Rollback stock levels if stock feature is active and stock was decremented
        const shouldCheckStock = req.store?.features?.showStock !== false;
        if (shouldCheckStock && (order.paymentMethod !== 'credit-card' || order.isPaid)) {
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
    const order = await Order.findOne({ _id: req.params.id, storeId: req.storeId }).populate('user', 'username email');

    if (order) {
        if (order.isDelivered) {
            return res.status(400).json({ message: 'ההזמנה כבר סומנה כנשלחה' });
        }
        order.isDelivered = true;
        order.deliveredAt = Date.now();

        const updatedOrder = await order.save();

        const customerEmail = updatedOrder.shippingAddress?.email || updatedOrder.user?.email;
        if (customerEmail) {
            try {
                await sendOrderReadyEmail(customerEmail, updatedOrder.toObject(), req.store);
            } catch (emailError) {
                console.error(`Failed to send order ready email for order ${updatedOrder._id}:`, emailError.message);
            }
        }

        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }
};

async function sendHypEnterpriseInvoice(order, store, cgUid) {
    const { dirName, username, isSandbox } = store.paymentSettings?.hyp || {};
    const { password, apiKey } = store.getDecryptedHypCredentials();

    if (!dirName || !username || !password) {
        throw new Error("Missing Hyp Enterprise credentials for invoicing.");
    }

    const cgRelayUrl = isSandbox !== false 
        ? 'https://cguat2.creditguard.co.il/xpo/Relay' 
        : 'https://cg.pay.co.il/xpo/Relay';

    const itemCodes = [];
    const itemNames = [];
    const itemQuantities = [];
    const itemPrices = [];

    for (const item of order.orderItems) {
        itemCodes.push('0');
        itemNames.push((item.product?.name || item.name || 'מוצר').replace(/[|<>]/g, ''));
        itemQuantities.push(item.quantity);
        itemPrices.push(Math.round(item.price * 100)); // convert to cents
    }

    if (order.shippingPrice > 0) {
        itemCodes.push('0');
        itemNames.push('דמי משלוח');
        itemQuantities.push('1');
        itemPrices.push(Math.round(order.shippingPrice * 100));
    }

    const xmlPayload = `
<ashrait>
    <request>
        <version>2000</version>
        <language>HEB</language>
        <command>addCgInvoice</command>
        <addCgInvoice>
            <invoiceAtranId>${cgUid}</invoiceAtranId>
            <terminalNumber>${dirName}</terminalNumber>
            <user>${username}</user>
            <password>${password}</password>
            <mid>${apiKey}</mid>
            <invoice>
                <invoiceCreationMethod>wait</invoiceCreationMethod>
                <invoiceSubject>חשבונית מס קבלה - ${store.name || 'הזמנה'}</invoiceSubject>
                <invoiceItemCode>${itemCodes.join('|')}</invoiceItemCode>
                <invoiceItemDescription>${itemNames.join('|')}</invoiceItemDescription>
                <invoiceItemQuantity>${itemQuantities.join('|')}</invoiceItemQuantity>
                <invoiceItemPrice>${itemPrices.join('|')}</invoiceItemPrice>
                <companyInfo>${order.shippingAddress?.fullName || order.user?.username || 'לקוח'}</companyInfo>
                <mailTo>${order.shippingAddress?.email || order.user?.email}</mailTo>
                <isItemPriceWithTax>1</isItemPriceWithTax>
                <sendMail>1</sendMail>
            </invoice>
        </addCgInvoice>
    </request>
</ashrait>`;

    const params = new URLSearchParams({ int_in: xmlPayload.trim() });
    
    const hypResponse = await axios.post(cgRelayUrl, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { XMLParser } = require('fast-xml-parser');
    const parser = new XMLParser();
    const parsed = parser.parse(hypResponse.data);

    if (parsed?.ashrait?.response?.result !== '000') {
        throw new Error(parsed?.ashrait?.response?.userMessage || "Failed to issue Enterprise invoice");
    }

    return parsed?.ashrait?.response?.addCgInvoice?.invoice?.invoiceDocUrl;
}

module.exports = {
    createOrder,
    getAllOrders,
    getNewOrders,
    getOrderDetails,
    markOrderAsSeen,
    cancelOrder,
    updateOrderToDelivered
};