const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    otpCode: {
        type: String,
        required: true,
    },
    shippingAddress: {
        street: String,
        city: String,
        zipCode: String,
        email: { type: String, required: true },
        phone: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '10m',
    },
});

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;