const mongoose = require('mongoose');
const Otp = require('../models/otp');

/**
 * @param {string} key
 * @param {string} otpCode
 * @param {object} shippingAddress
 * @param {Date} expiresAt
 */
const saveOtp = async (key, otpCode, shippingAddress, expiresAt) => {

    try {
        await Otp.findOneAndUpdate(
            { key: key },
            {
                otpCode,
                shippingAddress,
                createdAt: Date.now()
            },
            {
                upsert: true,
                new: true
            }
        );
        console.log(`[OTP Manager] OTP updated/saved for key: ${key}`);
    } catch (e) {
        console.error(`[OTP Manager] Failed to save/update OTP for key: ${key}`, e.message);
        throw new Error("שמירת קוד האימות נכשלה.");
    }
};

/**
 * @param {string} key
 * @param {string} otp
 * @returns {object}
 */
const verifyOtp = async (key, otp) => {
    if (!mongoose.connection.readyState) {
        throw new Error("Database connection not established.");
    }

    const otpRecord = await Otp.findOne({ key });

    if (!otpRecord) {
        return { isValid: false, message: 'הקוד פג תוקף או לא נשלח. אנא שלח קוד חדש.' };
    }

    if (otpRecord.otpCode !== otp) {
        return { isValid: false, message: 'קוד האימות שגוי. אנא נסה שוב.' };
    }


    return {
        isValid: true,
        message: 'אימות הושלם.',
        shippingAddress: otpRecord.shippingAddress
    };
};

/**
 * @param {string} key
 */
const deleteOtp = async (key) => {
    try {
        await Otp.deleteOne({ key });
        console.log(`[OTP Manager] OTP record deleted for key: ${key}`);
    } catch (e) {
        console.error(`[OTP Manager] Failed to delete OTP for key: ${key}`, e.message);
    }
};


module.exports = {
    saveOtp,
    verifyOtp,
    deleteOtp,
};