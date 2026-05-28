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

        await newUser.populate('storeId');
        const storeName = newUser.storeId?.name || 'החנות שלנו';

        const token = jwt.sign(
            {
                id: newUser._id,
                storeId: req.storeId,
                username: newUser.username,
                email: newUser.email,
                phone: newUser.phone,
                isAdmin: newUser.isAdmin,
                isSuperAdmin: newUser.isSuperAdmin
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        try {
            await sendRegistrationEmail(newUser.email, newUser.username, storeName);
            console.log(`Registration email sent successfully for store: ${storeName}`);
        } catch (emailErr) {
            console.error('Failed to send registration email (non-blocking):', emailErr);
        }

        return res.status(201).json({ token });

    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            const hebrewMessage = field === 'email' ? 'כתובת האימייל כבר קיימת במערכת' : 'שם המשתמש כבר קיים במערכת';
            return res.status(400).json({ message: hebrewMessage });
        }
        console.error('Registration failed:', err);
        return res.status(400).json({ message: err.message });
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
    try {
        const { email } = req.body;
        const user = await User.findOne({ email, storeId: req.storeId }).populate('storeId');
        if (!user) {
            return res.status(404).json({ message: 'לא נמצא חשבון תואם למייל הזה' });
        }

        const secret = process.env.JWT_SECRET + user.password;
        const token = jwt.sign({ id: user._id }, secret, { expiresIn: '1h' });

        const storeSlug = user.storeId?.slug;
        const storeName = user.storeId?.name || 'החנות שלנו';
        const resetUrl = `${process.env.FRONTEND_URL}/store/${storeSlug}/reset-password?token=${token}&id=${user._id}`;
        await sendResetPasswordEmail(user.email, resetUrl, storeName);

        return res.status(200).json({ message: 'קישור לאיפוס סיסמה נשלח לכתובת המייל שלך. אנא בדוק את תיבת הדואר הנכנס. (יש לבדוק בתיקיית ספאם)' });

    } catch (error) {
        if (error.response && error.response.body) {
            console.error('Resend Detailed Error:', JSON.stringify(error.response.body, null, 2));
        } else {
            console.error('Error in forgotPassword:', error);
        }
        return res.status(500).json({ message: 'שגיאת שרת פנימית בתהליך איפוס הסיסמה.' });
    }
};

/**
 * Resets the user's password using a valid reset token.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decodedPayload = jwt.decode(token);
        if (!decodedPayload || !decodedPayload.id) {
            return res.status(400).json({ message: 'טוקן לא תקין או פג תוקף.' });
        }

        const user = await User.findById(decodedPayload.id);
        if (!user) {
            return res.status(400).json({ message: 'המשתמש לא נמצא.' });
        }

        const secret = process.env.JWT_SECRET + user.password;
        jwt.verify(token, secret);

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'הסיסמה אופסה בהצלחה.' });
    } catch (err) {
        console.error("Reset password verification failed:", err);
        return res.status(400).json({ message: 'הקישור לאיפוס סיסמה פג תוקף או שאינו תקין.' });
    }
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

            const query = {
                "shippingAddress.email": guestEmail,
                isGuestOrder: true,
                storeId: req.storeId,
                $or: [
                    { paymentMethod: { $ne: 'credit-card' } },
                    { isPaid: true }
                ]
            };

            const orders = await Order.find(query).populate('orderItems.product');

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

        const query = {
            user: req.user.id,
            storeId: req.storeId,
            $or: [
                { paymentMethod: { $ne: 'credit-card' } },
                { isPaid: true }
            ]
        };

        const orders = await Order.find(query)
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