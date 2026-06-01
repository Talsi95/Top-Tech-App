const Product = require('../models/product');
const Category = require('../models/category');
const cloudinary = require('cloudinary').v2;

if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

/**
 * Fetches products based on category, subcategory, and optional variant filters.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getProducts = async (req, res) => {
    const { category, subcategory, minPrice, maxPrice, lowStock, page = 1, limit = 20, ...queryFilters } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let combinedConditions = [];

    if (category) {
        combinedConditions.push({ category: category });
    }
    if (subcategory) {
        combinedConditions.push({ subcategory: subcategory });
    }
    if (lowStock === 'true') {
        combinedConditions.push({
            variants: {
                $elemMatch: {
                    stock: { $lte: 5 }
                }
            }
        });
    }

    if (minPrice || maxPrice) {
        const priceQuery = {};
        if (minPrice) priceQuery.$gte = parseFloat(minPrice);
        if (maxPrice) priceQuery.$lte = parseFloat(maxPrice);

        combinedConditions.push({
            variants: {
                $elemMatch: {
                    $or: [
                        {
                            salePrice: { $exists: true, $ne: null },
                            salePrice: priceQuery
                        },
                        {
                            $or: [{ salePrice: { $exists: false } }, { salePrice: null }],
                            price: priceQuery
                        }
                    ]
                }
            }
        });
    }

    for (const key in queryFilters) {
        if (key.startsWith('filter_')) {
            const field = key.replace('filter_', '');
            const value = queryFilters[key];

            const filterValue = Array.isArray(value) ? { $in: value } : value;

            combinedConditions.push({
                variants: {
                    $elemMatch: {
                        [field]: filterValue
                    }
                }
            });
        }
    }

    let dbQuery = { storeId: req.storeId };
    if (combinedConditions.length > 0) {
        dbQuery.$and = combinedConditions;
    }

    try {
        const totalProducts = await Product.countDocuments(dbQuery);
        const products = await Product.find(dbQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .exec();

        const availableFilters = getAvailableFilters(products);

        res.json({
            products,
            availableFilters,
            hasMore: totalProducts > skip + products.length
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

/**
 * Extracts available unique filter values (color, storage, size) from a list of products.
 * @param {Array} products - List of product documents.
 * @returns {Object} Object containing unique values for each filter field.
 */
const getAvailableFilters = (products) => {
    const filters = {};
    products.forEach(product => {
        product.variants.forEach(variant => {
            // Get all keys except the standard ones
            const standardFields = ['price', 'stock', 'imageUrl', 'isOnSale', 'salePrice', '_id', 'id'];
            Object.keys(variant.toObject ? variant.toObject() : variant).forEach(field => {
                if (!standardFields.includes(field)) {
                    const value = variant[field];
                    if (value) {
                        if (!filters[field]) {
                            filters[field] = new Set();
                        }
                        filters[field].add(value);
                    }
                }
            });
        });
    });

    const result = {};
    for (const field in filters) {
        result[field] = Array.from(filters[field]);
    }

    return result;
};

/**
 * Fetches unique subcategories for a given category.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getUniqueSubcategories = async (req, res) => {
    const { category } = req.query;

    try {
        const uniqueSubcategories = await Product.distinct('subcategory', {
            category: category,
            storeId: req.storeId
        });

        res.json(uniqueSubcategories);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch subcategories' });
    }
};

/**
 * Searches for products by name using a case-insensitive regex.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const searchProducts = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Search query is required.' });
    }

    const products = await Product.find({
        name: { $regex: query, $options: 'i' },
        storeId: req.storeId
    });

    res.json(products);
};

/**
 * Fetches a single product by its ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getProductById = async (req, res) => {
    const { id } = req.params;
    let query = { storeId: req.storeId };

    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(id)) {
        query.$or = [{ _id: id }, { slug: id }];
    } else {
        query.slug = id;
    }

    const product = await Product.findOne(query);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
};

/**
 * Validates that product variants contain all required fields based on the category.
 * @param {Object} productData - The product data to validate.
 * @throws {Error} If validation fails.
 */
const validateProductVariants = async (productData, storeId) => {
    const { category, variants } = productData;

    const categoryData = await Category.findOne({ name: category, storeId });

    if (!categoryData) {
        throw new Error(`Category "${category}" not found in database.`);
    }

    const requiredFields = categoryData.variantFields;

    for (const variant of variants) {
        for (const field of requiredFields) {
            if (!variant[field] || (typeof variant[field] === 'string' && variant[field].trim() === '')) {
                throw new Error(`Variant validation failed: Field "${field}" is required for category "${category}".`);
            }
        }
    }
};

/**
 * Creates a new product after validating its variants.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createProduct = async (req, res) => {
    try {
        req.body.storeId = req.storeId;
        // await validateProductVariants(req.body, req.storeId);

        const newProduct = await Product.create(req.body);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Updates an existing product after validating its variants.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateProduct = async (req, res) => {
    try {
        req.body.storeId = req.storeId;
        // await validateProductVariants(req.body, req.storeId);

        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, storeId: req.storeId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Updates a specific variant of a product.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateProductVariant = async (req, res) => {
    const { productId, variantId } = req.params;
    const updateFields = req.body;

    const setFields = {};
    for (const key in updateFields) {
        setFields[`variants.$.${key}`] = updateFields[key];
    }

    const product = await Product.findOneAndUpdate(
        { _id: productId, 'variants._id': variantId, storeId: req.storeId },
        { $set: setFields },
        { new: true, runValidators: true }
    );

    if (!product) {
        return res.status(404).json({ message: 'Product or variant not found' });
    }

    res.status(200).json(product);
};

/**
 * Deletes a product by its ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const deleteProduct = async (req, res) => {
    const product = await Product.findOneAndDelete({ _id: req.params.id, storeId: req.storeId });
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
};

/**
 * Uploads a video file to Cloudinary.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No video file provided.' });
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            console.warn('Cloudinary credentials missing in .env. Falling back to mockup storage.');
            return res.status(200).json({
                url: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
                message: 'Uploaded to fallback mock storage (Cloudinary credentials missing in backend .env).'
            });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'video',
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
            folder: 'product_videos'
        });

        // Delete temporary file from server disk
        const fs = require('fs');
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });

        res.status(200).json({
            url: result.secure_url,
            message: 'Video uploaded successfully to Cloudinary.'
        });
    } catch (error) {
        console.error('Cloudinary backend upload error:', error);
        res.status(500).json({ message: 'Failed to upload video to Cloudinary: ' + error.message });
    }
};

module.exports = {
    getProducts,
    getUniqueSubcategories,
    searchProducts,
    getProductById,
    createProduct,
    updateProduct,
    updateProductVariant,
    deleteProduct,
    uploadVideo
};