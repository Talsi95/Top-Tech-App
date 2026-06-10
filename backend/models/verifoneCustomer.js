const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const verifoneCustomerSchema = new Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    phone: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    verifoneCustomerId: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Create indexes for fast lookup
verifoneCustomerSchema.index({ userId: 1, storeId: 1 });
verifoneCustomerSchema.index({ phone: 1, storeId: 1 });
verifoneCustomerSchema.index({ email: 1, storeId: 1 });

module.exports = mongoose.model('VerifoneCustomer', verifoneCustomerSchema);
