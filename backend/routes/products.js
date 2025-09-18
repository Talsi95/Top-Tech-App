const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
    try {
        const { category, subcategory } = req.query;

        let filter = {};

        if (category) {
            filter.category = category;
        }

        if (subcategory) {
            filter.subcategory = subcategory;
        }

        const products = await Product.find(filter);

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
        // הסר את הפירוק המוגבל של האובייקט והשתמש ב-req.body כולו.
        // Mongoose יעדכן רק שדות שקיימים בסכימה.
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body, // מעביר את כל הנתונים מהבקשה
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/:productId/variants/:variantId', protect, admin, async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        const updateFields = req.body;

        const product = await Product.findOneAndUpdate(
            { _id: productId, 'variants._id': variantId },
            { $set: { 'variants.$': updateFields } },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product or variant not found' });
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