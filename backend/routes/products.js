const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (err) {
        // טיפול במקרה של מזהה לא תקין
        res.status(400).json({ message: 'Invalid product ID' });
    }
});
router.post('/', async (req, res) => {
    try {
        const newProduct = await Product.create(req.body);
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { name, description, price, salePrice, isOnSale, imageUrl, category } = req.body;

        const updateFields = {
            name,
            description,
            price,
            imageUrl,
            category,
            isOnSale: isOnSale,
            salePrice: isOnSale ? salePrice : null
        };

        const product = await Product.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;