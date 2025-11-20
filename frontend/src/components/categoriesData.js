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