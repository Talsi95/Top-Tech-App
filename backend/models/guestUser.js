const mongoose = require('mongoose');

const guestUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    shippingAddress: {
        fullName: String,
        street: String,
        city: String,
        zipCode: String,
        phone: String,
    },
    otp: {
        type: String,
        required: true
    },
    otpExpires: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600
    }
});

module.exports = mongoose.model('GuestUser', guestUserSchema);