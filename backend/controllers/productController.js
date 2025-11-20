const Product = require('../models/product');

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
    getUniqueSubcategories,
    searchProducts,
    getProductById,
    createProduct,
    updateProduct,
    updateProductVariant,
    deleteProduct
};