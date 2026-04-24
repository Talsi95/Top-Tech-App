const Category = require('../models/category');

/**
 * Creates a new product category.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createCategory = async (req, res) => {
    try {
        const newCategory = await Category.create(req.body);
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Updates an existing category by its ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateCategory = async (req, res) => {
    const category = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );
    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
};

/**
 * Deletes a category by its ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const deleteCategory = async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ message: 'Category deleted successfully' });
};

/**
 * Fetches all categories from the database.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getCategories = async (req, res) => {
    const categories = await Category.find({});
    res.status(200).json(categories);
};

/**
 * Fetches categories and their associated variant fields for the admin dashboard.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getAdminCategoriesData = async (req, res) => {
    try {
        const categories = await Category.find({});

        const adminCategories = categories.reduce((acc, cat) => {
            acc[cat.name] = cat.subcategories.map(sub => sub.name);
            return acc;
        }, {});

        const adminVariantFields = categories.reduce((acc, cat) => {
            acc[cat.name] = cat.variantFields;
            return acc;
        }, {});

        res.status(200).json({ adminCategories, adminVariantFields });

    } catch (error) {
        res.status(500).json({ message: "Failed to fetch categories data." });
    }
};

module.exports = {
    createCategory,
    updateCategory,
    deleteCategory,
    getCategories,
    getAdminCategoriesData,
};