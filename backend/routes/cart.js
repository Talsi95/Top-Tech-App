const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/user');

router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('cart.product');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const formattedCart = user.cart.map(item => {
            const productData = item.product;
            const priceToUse = productData.isOnSale ? productData.salePrice : productData.price;

            return {
                _id: item._id,
                product: {
                    ...productData.toObject(),
                    price: priceToUse
                },
                quantity: item.quantity
            };
        });

        res.json(formattedCart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const { cartItems } = req.body;

        const updatedCart = cartItems.map(item => ({
            product: item.product,
            quantity: item.quantity
        }));

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { cart: updatedCart },
            { new: true, runValidators: true }
        ).populate('cart.product');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser.cart);
    } catch (err) {
        console.error("Error saving cart:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;