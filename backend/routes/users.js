const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');
const Order = require('../models/order');
const { sendRegistrationEmail } = require('../services/emailService');
const { protect, admin } = require('../middleware/authMiddleware');

const registerValidationRules = [
    body('username')
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
];

const loginValidationRules = [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').exists().withMessage('Password is required'),
];

router.post('/register', registerValidationRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email, password });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id, username: newUser.username, isAdmin: newUser.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token });

    } catch (err) {
        console.error('Registration failed:', err);
        res.status(400).json({ message: err.message });
    }

    try {
        const { username, email } = req.body;
        await sendRegistrationEmail(email, username);
        console.log('Registration email sent successfully.');
    } catch (emailErr) {
        console.error('Failed to send registration email (non-blocking):', emailErr);
    }
});

router.post('/login', loginValidationRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, username: user.username, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const orders = await Order.find({ user: req.user.id })
            .populate({
                path: 'orderItems.product',
                model: 'Product',
                populate: {
                    path: 'variants'
                }
            })
            .populate({
                path: 'orderItems.variant',
                model: 'Product'
            })
            .sort({ createdAt: -1 });

        const sanitizedOrders = orders.map(order => {
            const sanitizedItems = order.orderItems.filter(item => item.product !== null);
            return {
                ...order.toObject(),
                orderItems: sanitizedItems
            };
        });

        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            orders: sanitizedOrders,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});


module.exports = router;