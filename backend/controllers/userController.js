const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const Order = require('../models/order');
const { sendRegistrationEmail, sendResetPasswordEmail } = require('../services/emailService');

const register = async (req, res) => {
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
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            const hebrewMessage = field === 'email' ? 'כתובת האימייל כבר קיימת במערכת' : 'שם המשתמש כבר קיים במערכת';
            return res.status(400).json({ message: hebrewMessage });
        }
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
};


const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errorCode: 'VALIDATION_FAILED',
            message: 'הנתונים שהוזנו לא תקינים'
        });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(401).json({
            errorCode: 'USER_NOT_FOUND',
            message: 'המשתמש לא נמצא'
        });
    }

    if (!(await user.comparePassword(password))) {
        return res.status(401).json({
            errorCode: 'INVALID_PASSWORD',
            message: 'הסיסמה שגויה'
        });
    }

    const token = jwt.sign(
        { id: user._id, username: user.username, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.status(200).json({ token });
};


const forgotPassword = async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(200).json({ message: 'If a user with that email exists, a reset link has been sent.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendResetPasswordEmail(user.email, resetUrl);

    res.status(200).json({ message: 'Password reset email sent. Check your inbox.' });
};

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
};

const profile = async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const orders = await Order.find({ user: req.user.id })
        .populate({
            path: 'orderItems.product',
            model: 'Product',
        })
        .sort({ createdAt: -1 });

    const sanitizedOrders = orders.map(order => {
        const sanitizedItems = order.orderItems.filter(item => item.product !== null);
        return {
            ...order.toObject(),
            orderItems: sanitizedItems,
        };
    });

    res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        orders: sanitizedOrders,
    });
};

const getAllUsers = async (req, res) => {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
};

module.exports = { register, login, forgotPassword, resetPassword, profile, getAllUsers };