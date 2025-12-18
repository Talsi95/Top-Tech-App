const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.isGuest === true) {
                req.user = {
                    id: 'guest_' + decoded.email,
                    isGuest: true,
                    email: decoded.email,
                    token: token
                };
                return next();
            }

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

const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };