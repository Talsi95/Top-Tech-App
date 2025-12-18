const twilioClient = require('../services/twilioClient');
const jwt = require('jsonwebtoken');
const Otp = require('../models/otp');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const handleRequestOTP = async (req, res) => {
    const { phone, email } = req.body;

    const otpCode = generateOTP();

    try {
        await saveOtpForVerification(phone, otpCode, email);

        const message = await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            contentSid: process.env.TWILIO_OTP_CONTENT_SID,
            contentVariables: JSON.stringify({ "1": otpCode }),
            to: `whatsapp:${phone}`
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
 * @param {string} phone
 * @param {string} otpCode
 * @param {string} email
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
 * @param {string} phone
 * @param {string} otpCode
 */
const handleVerifyOTP = async (req, res) => {
    const { phone, otp: otpFromClient } = req.body;
    const cleanPhone = phone ? phone.trim() : null;
    const cleanOtpCode = otpFromClient ? otpFromClient.trim() : null;
    try {
        const otpEntry = await Otp.findOne({
            key: cleanPhone,
            otpCode: cleanOtpCode
        }).exec();

        if (!otpEntry) {
            return res.status(401).json({ message: 'קוד אימות לא תקין או פג תוקף.' });
        }

        const guestEmail = otpEntry.email;

        await Otp.deleteOne({ key: phone });

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

module.exports = { handleRequestOTP, handleVerifyOTP };