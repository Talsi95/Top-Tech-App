const HypToken = require('../models/hypToken');
const Order = require('../models/order');
const axios = require('axios');
const qs = require('querystring');

/**
 * שליפת טוקן מ-Hyp אחרי תשלום מוצלח
 * @param {Object} store - חנות (עם credentials מוצפנים)
 * @param {String} transactionId - ה-Id מה-redirect לאחר תשלום
 * @param {Object} order - ההזמנה
 * @returns {Object} {Token, Tokef}
 */
const getHypToken = async (store, transactionId, order) => {
    console.log("Hyp getToken called for Order:", order?._id, "Transaction:", transactionId);
    const { dirName, username } = store.paymentSettings.hyp;
    const { password, apiKey } = store.getDecryptedHypCredentials();

    if (!dirName || !apiKey || !password || !transactionId) {
        throw new Error("פרטי Hyp או מזהה עסקה חסרים לשליפת טוקן");
    }

    const params = {
        action: 'getToken',
        Masof: dirName,
        PassP: password,
        TransId: transactionId,
        allowFalse: 'True'
    };

    const queryString = qs.stringify(params);
    const response = await axios.get(`https://pay.hyp.co.il/p/?${queryString}`);
    const data = qs.parse(response.data); // URL-encoded string

    if (data.CCode !== '0') {
        // CCode=904 = token not available (e.g., card doesn't support tokenization)
        // This is NOT a critical error - just means we can't save the card
        console.warn(`[getHypToken] Non-zero CCode from Hyp: CCode=${data.CCode}. Token not available.`);
        return { Token: null, Tokef: null };
    }

    const { Token, Tokef } = data;
    if (!Token || !Tokef) {
        console.warn('[getHypToken] Token or Tokef empty despite CCode=0.');
        return { Token: null, Tokef: null };
    }

    // שמירת הטוקן במסד (upsert - עדכן אם קיים, אחרת צור חדש)
    await HypToken.findOneAndUpdate(
        {
            storeId: store._id,
            transactionId: transactionId
        },
        {
            storeId: store._id,
            userId: order.user || null,
            guestToken: order.isGuestOrder ? order.guestToken : null,
            guestIdentifier: {
                phone: order.shippingAddress?.phone,
                email: order.shippingAddress?.email
            },
            token: Token,
            tokef: Tokef,
            transactionId: transactionId,
            lastUsed: Date.now(),
            active: true
        },
        { upsert: true, new: true }
    );

    // עדכון ההזמנה עם פרטי הטוקן
    await Order.updateOne(
        { _id: order._id },
        {
            $set: {
                'paymentResult.hypTransactionId': transactionId,
                'paymentResult.hypToken': Token,
                'paymentResult.hypTokef': Tokef
            }
        }
    );

    console.log(`[Hyp Tokenization] Token saved for transaction ${transactionId}: ${Token}`);

    return { Token, Tokef };
};



/**
 * שליפת כל הכרטיסים השמורים של משתמש מחובר
 * @param {Object} req - Express request object (req.user._id, req.storeId)
 * @param {Object} res - Express response object
 */
const getUserTokens = async (req, res) => {
    const query = {
        storeId: req.storeId,
        active: true
    };

    if (req.user?.isGuest) {
        query.guestToken = req.user.token;
    } else {
        query.userId = req.user._id;
    }

    const tokens = await HypToken.find(query).select('token tokef transactionId lastUsed createdAt')
        .sort({ lastUsed: -1 });

    // מחזיר רק 4 ספרות אחרונות של הטוקן + תוקף
    const sanitizedTokens = tokens.map(t => ({
        _id: t._id,
        lastFour: t.token.slice(-4),
        tokef: t.tokef,
        expiryMonth: t.tokef.slice(0, 2),
        expiryYear: '20' + t.tokef.slice(2, 4),
        lastUsed: t.lastUsed,
        createdAt: t.createdAt
    }));

    res.json(sanitizedTokens);
};

/**
 * מחיקת כרטיס שמור לפי מזהה
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteToken = async (req, res) => {
    const token = await HypToken.findOneAndUpdate(
        {
            _id: req.params.id,
            storeId: req.storeId,
            userId: req.user._id,
            active: true
        },
        { active: false },
        { new: true }
    );

    if (!token) {
        return res.status(404).json({ message: 'כרטיס שמור לא נמצא' });
    }

    res.json({ message: 'הכרטיס הוסר בהצלחה' });
};

module.exports = { getHypToken, getUserTokens, deleteToken };
