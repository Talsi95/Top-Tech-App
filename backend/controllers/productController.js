const Product = require('../models/product');

const getProducts = async (req, res) => {
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
};

const searchProducts = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Search query is required.' });
    }

    const products = await Product.find({
        name: { $regex: query, $options: 'i' }
    });

    res.json(products);
};

const getProductById = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
};

const createProduct = async (req, res) => {
    const newProduct = await Product.create(req.body);
    res.status(201).json(newProduct);
};

const updateProduct = async (req, res) => {
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
};

const updateProductVariant = async (req, res) => {
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
};

const deleteProduct = async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
};

module.exports = {
    getProducts,
    searchProducts,
    getProductById,
    createProduct,
    updateProduct,
    updateProductVariant,
    deleteProduct
};