const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');
const Order = require('../models/order');
const { sendRegistrationEmail } = require('../services/emailService');
const { protect, admin } = require('../middleware/authMiddleware');

// כללי אימות להרשמה
const registerValidationRules = [
    body('username')
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
];

// כללי אימות להתחברות
const loginValidationRules = [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').exists().withMessage('Password is required'),
];

// נתיב הרשמה
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
        console.error('Registration failed:', err); // הדפס את השגיאה המדויקת
        res.status(400).json({ message: err.message });
    }

    // הוספת שליחת המייל כאן, מחוץ לבלוק ה-try...catch
    try {
        const { username, email } = req.body;
        await sendRegistrationEmail(email, username);
        console.log('Registration email sent successfully.');
    } catch (emailErr) {
        console.error('Failed to send registration email (non-blocking):', emailErr);
    }
});

// נתיב התחברות
router.post('/login', loginValidationRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        // איתור המשתמש לפי אימייל
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // השוואת הסיסמה באמצעות הפונקציה המותאמת אישית שיצרת
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // הוספת שם המשתמש לאסימון!
        const token = jwt.sign({ id: user._id, username: user.username, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // החזרת האסימון ללקוח
        res.status(200).json({ token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.get('/profile', protect, async (req, res) => {
    try {
        // המשתמש מזוהה על ידי req.user.id לאחר שעבר את middleware 'protect'
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // שליפת כל ההזמנות של המשתמש
        const orders = await Order.find({ user: req.user.id }).populate('orderItems.product');

        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            orders: orders,
        });

    } catch (err) {
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