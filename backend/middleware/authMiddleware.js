const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Middleware that protects routes by verifying the JWT token.
 * Supports both registered users and guest checkout tokens.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Handle guest tokens (used for guest checkout tracking).
            if (decoded.isGuest === true) {
                req.user = {
                    id: 'guest_' + decoded.email,
                    isGuest: true,
                    email: decoded.email,
                    phone: decoded.phone,
                    token: token
                };
                return next();
            }

            // Fetch authenticated user from DB.
            const user = await User.findById(decoded.id).select('id username email isAdmin');

            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user = user;
            req.user.isGuest = false;

            next();

        } catch (error) {
            console.error(`Auth failed: ${error.message}`);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * Middleware that restricts access to administrative routes.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 */
const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };