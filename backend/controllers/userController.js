const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const Order = require('../models/order');
const { sendRegistrationEmail, sendResetPasswordEmail } = require('../services/emailService');

/**
 * Registers a new user, hashes their password, and sends a welcome email.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, email, password, phone } = req.body;
        const newUser = new User({ username, email, password, phone, storeId: req.storeId });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id, storeId: req.storeId, username: newUser.username, email: newUser.email, phone: newUser.phone, isAdmin: newUser.isAdmin, isSuperAdmin: newUser.isSuperAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });

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


/**
 * Authenticates a user and returns a JWT token.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errorCode: 'VALIDATION_FAILED',
            message: 'הנתונים שהוזנו לא תקינים'
        });
    }

    const { email, password } = req.body;
    let user = await User.findOne({ email, storeId: req.storeId });

    if (!user) {
        // Fallback: Check if there's a Super Admin with this email globally, allowing login from any store.
        user = await User.findOne({ email, isSuperAdmin: true });
    }

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
        { 
            id: user._id, 
            storeId: user.isSuperAdmin ? (user.storeId || req.storeId) : req.storeId, 
            username: user.username, 
            email: user.email, 
            phone: user.phone, 
            isAdmin: user.isAdmin, 
            isSuperAdmin: user.isSuperAdmin 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.status(200).json({ token });
};


/**
 * Sends a password reset email with a temporary JWT token.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email, storeId: req.storeId });
    if (!user) {
        return res.status(200).json({ message: 'If a user with that email exists, a reset link has been sent.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendResetPasswordEmail(user.email, resetUrl);

    res.status(200).json({ message: 'Password reset email sent. Check your inbox.' });
};

/**
 * Resets the user's password using a valid reset token.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
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

/**
 * Fetches the logged-in user's profile and their order history.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const profile = async (req, res) => {
    try {
        if (req.user.isGuest) {
            const guestEmail = req.user.email;

            const orders = await Order.find({
                "shippingAddress.email": guestEmail,
                isGuestOrder: true,
                storeId: req.storeId
            }).populate('orderItems.product');

            return res.json({
                username: 'אורח',
                email: guestEmail,
                phone: req.user.phone,
                isGuest: true,
                orders: orders
            });
        }

        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const orders = await Order.find({ user: req.user.id, storeId: req.storeId })
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
            phone: user.phone,
            isAdmin: user.isAdmin,
            orders: sanitizedOrders,
        });
    } catch (error) {
        res.status(500).json({ message: 'שגיאת שרת' });
    }
};

/**
 * Fetches a list of all registered users (admin only).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getAllUsers = async (req, res) => {
    const users = await User.find({ storeId: req.storeId }).select('-password');
    res.status(200).json(users);
};

/**
 * Updates the logged-in user's profile information.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }

        const { email, phone, username } = req.body;

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email, storeId: req.storeId });
            if (emailExists) {
                return res.status(400).json({ message: 'כתובת המייל כבר קיימת במערכת' });
            }
            user.email = email;
        }

        if (phone !== undefined) {
            user.phone = phone;
        }

        if (username && username !== user.username) {
            const usernameExists = await User.findOne({ username, storeId: req.storeId });
            if (usernameExists) {
                return res.status(400).json({ message: 'שם המשתמש כבר קיים במערכת' });
            }
            user.username = username;
        }

        const updatedUser = await user.save();

        const token = jwt.sign(
            { id: updatedUser._id, storeId: req.storeId, username: updatedUser.username, email: updatedUser.email, phone: updatedUser.phone, isAdmin: updatedUser.isAdmin, isSuperAdmin: updatedUser.isSuperAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                phone: updatedUser.phone,
                isAdmin: updatedUser.isAdmin,
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'שגיאת שרת בעדכון הפרופיל' });
    }
};

module.exports = { register, login, forgotPassword, resetPassword, profile, getAllUsers, updateProfile };