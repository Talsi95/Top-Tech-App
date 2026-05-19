const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const userSchema = new Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: false // Will be true after migration
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isSuperAdmin: {
        type: Boolean,
        default: false
    },
    cart: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },
            variant: {
                type: mongoose.Schema.Types.ObjectId,
                required: false
            },
            selectedOptions: [{
                name: { type: String },
                choice: { type: String },
                priceAddition: { type: Number, default: 0 }
            }],
            quantity: {
                type: Number,
                required: true,
            }
        }
    ]
}, {
    timestamps: true
});

userSchema.index({ email: 1, storeId: 1 }, { unique: true });
userSchema.index({ username: 1, storeId: 1 }, { unique: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;