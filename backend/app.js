const mongoose = require('mongoose');
const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
const cors = require('cors');

const allowedOrigins = [
    'http://localhost:5001',
    'http://localhost:5173',
    'http://localhost',
    'http://127.0.0.1'
];

app.use(cors({
    origin: function (origin, callback) {
        // This is a much safer way to check the origin
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("CORS blocked from origin: " + origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

app.use('/api/products', productRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

mongoose.connect(process.env.MONGO_URI, {

})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.listen(5000, '0.0.0.0', () => {
    console.log('Server running on port 5000');
});