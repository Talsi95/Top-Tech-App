const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hypTokenSchema = new Schema({
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
    guestToken: {
        type: String,
        required: false
    },
    guestIdentifier: {
        phone: { type: String },
        email: { type: String }
    },
    token: {
        type: String,
        required: true
    },
    tokef: {
        type: String, // תוקף הכרטיס (MMYY)
        required: true
    },
    transactionId: {
        type: String, // ה-Id מהחזרת התשלום
        required: true
    },
    lastUsed: {
        type: Date
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

hypTokenSchema.index({ storeId: 1, token: 1 });
hypTokenSchema.index({ storeId: 1, userId: 1 });
hypTokenSchema.index({ storeId: 1, guestToken: 1 });
hypTokenSchema.index({ storeId: 1, transactionId: 1 }, { unique: true });

module.exports = mongoose.model('HypToken', hypTokenSchema);