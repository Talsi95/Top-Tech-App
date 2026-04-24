/**
 * Static configuration for product categories and their relevant variant fields.
 */
export const categories = [
    {
        name: 'מכשירים ניידים',
        variantFields: ['color', 'storage']
    },
    {
        name: 'קונסולות משחק',
        variantFields: ['storage']
    },
    {
        name: 'מחשבים ניידים',
        variantFields: ['color', 'storage']
    },
    {
        name: 'טלוויזיות',
        variantFields: ['size']
    },
    {
        name: 'אוזניות',
        variantFields: ['color']
    }
];

/**
 * Transforms the categories array into an object mapping category names to their required variant fields.
 * @param {Array} categoriesArray - The array of category objects.
 * @returns {Object} A map for quick lookup of variant fields by category name.
 */
export const getAdminVariantFields = (categoriesArray) => {
    return categoriesArray.reduce((acc, current) => {
        acc[current.name] = current.variantFields;
        return acc;
    }, {});
};

export const getAdminCategories = (categoriesArray) => {
    return categoriesArray.reduce((acc, current) => {
        acc[current.name] = current.subcategories.map(sub => sub.name);
        return acc;
    }, {});
};