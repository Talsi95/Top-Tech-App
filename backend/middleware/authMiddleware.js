const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // קבלת האסימון מהכותרת
            token = req.headers.authorization.split(' ')[1];

            // אימות האסימון
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // הוספת נתוני המשתמש לבקשה כדי שיהיו זמינים לנתיב
            req.user = decoded;

            next(); // המשך הלאה לנתיב
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
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