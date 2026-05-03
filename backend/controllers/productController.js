const Product = require('../models/product');
const Category = require('../models/category');

/**
 * Fetches products based on category, subcategory, and optional variant filters.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getProducts = async (req, res) => {
    const { category, subcategory, ...queryFilters } = req.query;

    let combinedConditions = [];

    if (category) {
        combinedConditions.push({ category: category });
    }
    if (subcategory) {
        combinedConditions.push({ subcategory: subcategory });
    }

    const variantFields = ['color', 'storage', 'size'];

    for (const key in queryFilters) {
        if (key.startsWith('filter_')) {
            const field = key.replace('filter_', '');
            const value = queryFilters[key];

            if (variantFields.includes(field)) {
                combinedConditions.push({
                    variants: {
                        $elemMatch: {
                            [field]: value
                        }
                    }
                });
            }
        }
    }

    let dbQuery = {};
    if (combinedConditions.length > 0) {
        dbQuery.$and = combinedConditions;
    }

    try {
        const products = await Product.find(dbQuery).exec();

        const availableFilters = getAvailableFilters(products);

        res.json({ products, availableFilters });
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
    const relevantFields = ['color', 'storage', 'size'];

    products.forEach(product => {
        product.variants.forEach(variant => {
            relevantFields.forEach(field => {
                const value = variant[field];
                if (value) {
                    if (!filters[field]) {
                        filters[field] = new Set();
                    }
                    filters[field].add(value);
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
            category: category
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
        name: { $regex: query, $options: 'i' }
    });

    res.json(products);
};

/**
 * Fetches a single product by its ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getProductById = async (req, res) => {
    const product = await Product.findById(req.params.id);
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
const validateProductVariants = async (productData) => {
    const { category, variants } = productData;

    const categoryData = await Category.findOne({ name: category });

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
        await validateProductVariants(req.body);

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
        await validateProductVariants(req.body);

        const product = await Product.findByIdAndUpdate(
            req.params.id,
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
        { _id: productId, 'variants._id': variantId },
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
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
};

module.exports = {
    getProducts,
    getUniqueSubcategories,
    searchProducts,
    getProductById,
    createProduct,
    updateProduct,
    updateProductVariant,
    deleteProduct
};