const twilioClient = require('../services/twilioClient');
const jwt = require('jsonwebtoken');
const Otp = require('../models/otp');
const Order = require('../models/order');
const admin = require('firebase-admin');

const verifyFirebaseAndSyncGuest = async (req, res) => {
    const { token, email } = req.body;

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const phone = decodedToken.phone_number;

        let finalEmail = email;

        const lastOrder = await Order.findOne({ "shippingAddress.phone": phone })
            .sort({ createdAt: -1 });

        if (!finalEmail) {
            if (lastOrder) {
                finalEmail = lastOrder.shippingAddress.email;
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'לא נמצאה היסטוריית הזמנות למספר זה. אנא בצע הזמנה קודם.'
                });
            }
        }
        const guestToken = jwt.sign(
            {
                isGuest: true,
                phone: phone,
                email: finalEmail
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            guestToken,
            email: finalEmail,
            isNewGuest: !lastOrder
        });

    } catch (error) {
        console.error("Firebase Verify Error:", error);
        res.status(401).json({ success: false, message: 'אימות נכשל' });
    }
};

/**
 * Generates a random 6-digit OTP code.
 * @returns {string} The generated OTP.
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Handles the request for a new OTP code via WhatsApp (using Twilio).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const handleRequestOTP = async (req, res) => {
    const { phone, email } = req.body;

    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '+972' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+972' + formattedPhone;
    }

    let finalEmail = email;

    try {
        if (!finalEmail) {
            const lastOrder = await Order.findOne({ "shippingAddress.phone": phone })
                .sort({ createdAt: -1 });

            if (!lastOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'לא נמצאה הזמנה קודמת למספר זה. אם זו הזמנתך הראשונה, אנא המשך מהצ׳ק-אאוט.'
                });
            }
            finalEmail = lastOrder.shippingAddress.email;
        }
        const otpCode = generateOTP();
        await saveOtpForVerification(formattedPhone, otpCode, finalEmail);

        const message = await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            contentSid: process.env.TWILIO_OTP_CONTENT_SID,
            contentVariables: JSON.stringify({ "1": otpCode }),
            to: `whatsapp:${formattedPhone}`
        });

        console.log(`WhatsApp OTP sent: ${message.sid}`);
        res.status(200).json({
            success: true,
            message: 'קוד אימות נשלח בהצלחה.',
            sid: message.sid
        });
    } catch (error) {
        console.error('Twilio WhatsApp request failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'שליחת קוד האימות נכשלה.'
        });
    }
};

/**
 * Saves a new OTP code to the database for future verification.
 * @param {string} phone - The phone number.
 * @param {string} otpCode - The OTP code.
 * @param {string} email - The user's email.
 */
const saveOtpForVerification = async (phone, otpCode, email) => {
    await Otp.deleteMany({ key: phone });

    const newOtpEntry = new Otp({
        key: phone,
        otpCode: otpCode,
        email: email
    });

    await newOtpEntry.save();

    console.log(`New OTP entry saved for phone: ${phone}`);
};

/**
 * Verifies the OTP code provided by the client and issues a guest JWT token.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const handleVerifyOTP = async (req, res) => {
    const { phone, otp: otpFromClient } = req.body;
    const cleanPhone = phone ? phone.trim() : null;
    const cleanOtpCode = otpFromClient ? otpFromClient.trim() : null;
    try {
        const isDevMode = true;

        let guestEmail;

        if (isDevMode) {
            const otpEntry = await Otp.findOne({ key: cleanPhone }).exec();

            guestEmail = otpEntry ? otpEntry.email : "test-dev@example.com";

            console.log(`Dev Mode: Auto-approving ${cleanPhone}. Found email: ${guestEmail}`);
        } else {
            const otpEntry = await Otp.findOne({
                key: cleanPhone,
                otpCode: cleanOtpCode
            }).exec();

            if (!otpEntry) {
                return res.status(401).json({ message: 'קוד אימות לא תקין או פג תוקף.' });
            }

            guestEmail = otpEntry.email;
            await Otp.deleteOne({ key: phone });
        }

        const guestPayload = {
            isGuest: true,
            email: guestEmail,
        };

        const guestToken = jwt.sign(
            guestPayload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log(`Manual verification approved, Token issued for ${phone}`);

        return res.status(200).json({
            success: true,
            message: 'אימות הושלם בהצלחה.',
            guestToken: guestToken,
            email: guestEmail
        });

    } catch (error) {
        console.error('Manual OTP verification failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'אימות הקוד נכשל עקב שגיאת שרת.'
        });
    }
};

module.exports = { handleRequestOTP, handleVerifyOTP, verifyFirebaseAndSyncGuest };