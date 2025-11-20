const router = require('express').Router();
const GuestUser = require('../models/guestUser');
const { sendOTPEmail } = require('../services/emailService');
const twilio = require('twilio');
const OtpManager = require('../services/otpManager');
const twilioClient = require('../services/twilioClient');



const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

const handleRequestOTP = async (req, res) => {
    const { phone } = req.body;
    try {
        const verification = await twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)
            .verifications
            .create({
                to: phone,
                channel: 'sms'
            });

        console.log(`Verification requested: ${verification.sid}, Status: ${verification.status}`);
        return { success: true, sid: verification.sid };

    } catch (error) {
        console.error('Twilio Verify request failed:', error.message);
        return { success: false, message: 'שליחת קוד האימות נכשלה.' };
    }
};

const handleVerifyOTP = async (phone, otpCode) => {
    try {
        const verificationCheck = await twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks
            .create({
                to: phone,
                code: otpCode
            });

        console.log(`Verification check status: ${verificationCheck.status}`);

        if (verificationCheck.status === 'approved') {
            return { success: true };
        } else {
            return { success: false, message: 'קוד אימות לא תקין או פג תוקף.' };
        }

    } catch (error) {
        console.error('Twilio Verify check failed:', error.message);
        return { success: false, message: 'אימות הקוד נכשל.' };
    }
};

module.exports = { handleRequestOTP, handleVerifyOTP };