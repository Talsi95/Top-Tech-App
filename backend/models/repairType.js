const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const repairTypeSchema = new Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: false // Will be true after migration
    },
    name: {
        type: String,
        required: true,
        trim: true
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

repairTypeSchema.index({ name: 1, storeId: 1 }, { unique: true });


const RepairType = mongoose.model('RepairType', repairTypeSchema);

module.exports = RepairType;
