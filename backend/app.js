// Entry point for the Express backend application.
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const express = require('express');
const path = require('path');
const app = express();
const API_PREFIX = '/api';
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/db');
const corsMiddleware = require('./middleware/corsMiddleware');
const serviceAccount = require('./serviceAccountKey.json');
const admin = require('firebase-admin');

// Initialize database connection.
connectDB();

// Setup CORS for development environment.
if (process.env.NODE_ENV === 'development') {
    app.use(corsMiddleware);
}

// Request parsing middleware.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Cache Control (no-cache by default for API routes).
app.use(API_PREFIX, (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized Successfully");
}

// Import and use API routes.
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const guestRoutes = require('./routes/guestRoutes')
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const categoryRoutes = require('./routes/categoryRoutes');
const repairRoutes = require('./routes/repairRoutes');
const repairTypeRoutes = require('./routes/repairTypeRoutes');

app.use('/api/products', productRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/repair-types', repairTypeRoutes);

// Static file hosting for the frontend production build.
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback: redirect non-API requests to the frontend index.html.
app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.use(errorHandler);

app.listen(5000, '0.0.0.0', () => {
    console.log('Server running on port 5000');
});