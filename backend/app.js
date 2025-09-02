const mongoose = require('mongoose');
const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');

const corsOptions = {
    origin: 'http://localhost:5173',
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const cartRoutes = require('./routes/cart');

app.use('/api/products', productRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/cart', cartRoutes);

mongoose.connect(process.env.MONGO_URI, {

})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.listen(5000, '0.0.0.0', () => {
    console.log('Server running on port 5000');
});