const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    },
    variant: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Product'
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
});


const orderSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User'
    },
    guestToken: {
        type: String,
        required: false
    },
    isGuestOrder: {
        type: Boolean,
        default: false
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        zipCode: { type: String, required: false },
        email: { type: String, required: false },
        phone: { type: String, required: true },
        fullName: { type: String, required: true }
    },
    shippingMethod: {
        type: String,
        required: true,
        default: 'pickup-business'
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0
    },
    paymentMethod: {
        type: String,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    paymentResult: {
        id: { type: String },
        status: { type: String },
        update_time: { type: String },
        email_address: { type: String }
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false
    },
    paidAt: {
        type: Date
    },
    isDelivered: {
        type: Boolean,
        required: true,
        default: false
    },
    isCancelled: {
        type: Boolean,
        required: true,
        default: false
    },
    cancelledAt: {
        type: Date
    },
    isUnseen: {
        type: Boolean,
        required: true,
        default: true
    },
    deliveredAt: {
        type: Date
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;