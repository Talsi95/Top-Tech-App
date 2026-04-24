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
    email: { type: String },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '10m',
    },
});

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;