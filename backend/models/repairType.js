const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const repairTypeSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    price: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    stock: {
        type: Number,
        required: false,
        default: 0
    }
}, {
    timestamps: true
});

const RepairType = mongoose.model('RepairType', repairTypeSchema);

module.exports = RepairType;
