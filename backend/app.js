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

// Content Security Policy middleware for iframe-based payment integrations
// HYP_DIGITAL_WALLETS_INTEGRATION: We allow additional origins for Apple Pay iframe script
app.use((req, res, next) => {
    // Get the origin from the request to dynamically allow our own domain in frame-src
    // This is critical for Hyp/CreditGuard redirecting back to our success/error URLs within an iframe
    let frameOrigins = 'https://*.creditguard.co.il https://*.hyp.co.il https://*.vficloud.net https://*.verifone.cloud https://*.vfims.com https://checkout.vficloud.net https://cst.checkout.vficloud.net';
    const origin = req.headers.origin || '';
    const host = req.headers.host || '';

    // Allow the current origin (if present) so the iframe can redirect back to our success/error/cancel URLs
    if (origin && !frameOrigins.includes(origin)) {
        frameOrigins += ` ${origin}`;
    }

    // Also allow the host (for cases where Origin header might not be set, e.g., some mobile browsers)
    if (host) {
        const hostOrigin = `${req.protocol}://${host}`;
        if (!frameOrigins.includes(hostOrigin)) {
            frameOrigins += ` ${hostOrigin}`;
        }
    }

    res.setHeader(
        'Content-Security-Policy',
        `frame-src ${frameOrigins}; ` +
        "connect-src 'self' https://*.creditguard.co.il https://*.hyp.co.il https://*.vficloud.net https://*.verifone.cloud https://*.vfims.com; " +
        "script-src 'self' 'unsafe-inline' https://*.creditguard.co.il https://*.hyp.co.il https://ppsuat.creditguard.co.il https://pps.creditguard.co.il https://*.vficloud.net https://*.verifone.cloud https://*.vfims.com; " +
        "img-src 'self' data: https://*.creditguard.co.il https://*.hyp.co.il https:;"
    );
    next();
});

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
const articlesRoutes = require('./routes/articles');
const storeResolver = require('./middleware/storeResolver');
const storeRoutes = require('./routes/stores');
const checkoutRoutes = require('./routes/checkoutRoutes');
const hypTokenRoutes = require('./routes/hypTokens');
const couponRoutes = require('./routes/couponRoutes');

// Serve Apple Pay domain association file for Digital Wallet (Apple Pay) support
// Required by Apple for iframe-based payment page integration with Hyp
app.get('/.well-known/apple-developer-merchantid-domain-association', (req, res) => {
    const fs = require('fs');
    // Try multiple locations: production build, public folder, or local
    const possiblePaths = [
        path.join(__dirname, 'dist', 'client', '.well-known', 'apple-developer-merchantid-domain-association'),
        path.join(__dirname, '..', 'public', '.well-known', 'apple-developer-merchantid-domain-association'),
        path.join(__dirname, '..', 'frontend', 'public', '.well-known', 'apple-developer-merchantid-domain-association')
    ];
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            return res.type('text/plain').send(fs.readFileSync(filePath, 'utf8'));
        }
    }
    // Fallback: fetch from Hyp's sandbox environment
    const https = require('https');
    https.get('https://ppsuat.creditguard.co.il/.well-known/apple-developer-merchantid-domain-association', (hypRes) => {
        let data = '';
        hypRes.on('data', chunk => data += chunk);
        hypRes.on('end', () => res.type('text/plain').send(data));
    }).on('error', () => res.status(404).send('Apple Pay domain association file not found. Please download it from https://ppsuat.creditguard.co.il/.well-known/apple-developer-merchantid-domain-association and place it in the public/.well-known/ directory.'));
});

app.use('/api/products', storeResolver, productRoutes);
app.use('/api/auth', storeResolver, userRoutes);
app.use('/api/guest', storeResolver, guestRoutes);
app.use('/api/cart', storeResolver, cartRoutes);
app.use('/api/orders', storeResolver, orderRoutes);
app.use('/api/categories', storeResolver, categoryRoutes);
app.use('/api/repairs', storeResolver, repairRoutes);
app.use('/api/repair-types', storeResolver, repairTypeRoutes);
app.use('/api/articles', storeResolver, articlesRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/checkout', storeResolver, checkoutRoutes);
app.use('/api/admin/coupons', storeResolver, couponRoutes);
app.use('/api/account', storeResolver, hypTokenRoutes);

const { getSitemap } = require('./controllers/sitemapController');
app.get('/store/:slug/sitemap.xml', getSitemap);

// Static file hosting for the frontend production build.
app.use(express.static(path.join(__dirname, 'dist/client'), { index: false }));

// SSR handler for all non-API requests
const ssrHandler = require('./middleware/ssrHandler');
app.get(/^\/(?!api).*/, ssrHandler);

// Support for direct access to sitemap.xml (for custom domains in the future or clean redirects)
app.get('/sitemap.xml', (req, res, next) => {
    // if you have a mechanism to identify slug by domain, you can pass it dynamically to the controller
    // meanwhile this ensures broader support
    next();
});

app.use(errorHandler);

app.listen(5000, '0.0.0.0', () => {
    console.log('Server running on port 5000');
});