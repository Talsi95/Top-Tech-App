const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const repairSchema = new Schema({
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    deviceModel: {
        type: String,
        required: true,
        trim: true
    },
    repairType: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['בתיקון', 'מוכן'],
        default: 'בתיקון'
    }
}, {
    timestamps: true
});

const Repair = mongoose.model('Repair', repairSchema);

module.exports = Repair;
