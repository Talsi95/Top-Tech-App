const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/user');

// נתיב לקבלת העגלה של המשתמש המחובר
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('cart.product');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// נתיב לעדכון ושמירת העגלה של המשתמש המחובר
router.post('/', protect, async (req, res) => {
    try {
        const { cartItems } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // המרה של נתוני העגלה מהלקוח לפורמט שמתאים למודל
        const updatedCart = cartItems.map(item => ({
            product: item._id,
            quantity: item.quantity
        }));

        user.cart = updatedCart;
        await user.save();
        res.status(200).json({ message: 'Cart saved successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;