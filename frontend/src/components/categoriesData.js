export const categories = [
    {
        name: 'מכשירים ניידים',
        subcategories: [
            { name: 'אייפון - Apple', link: '/products?category=מכשירים ניידים&subcategory=אייפון' },
            { name: 'גלקסי - Samsung', link: '/products?category=מכשירים ניידים&subcategory=גלקסי' },
            { name: 'פיקסל - Google', link: '/products?category=מכשירים ניידים&subcategory=גוגל פיקסל' },
        ],
        variantFields: ['color', 'storage']
    },
    {
        name: 'קונסולות משחק',
        subcategories: [
            { name: 'סוני', link: '/products?category=קונסולות משחק&subcategory=סוני' },
            { name: 'אקסבוקס', link: '/products?category=קונסולות משחק&subcategory=אקסבוקס' },
            { name: 'נינטנדו', link: '/products?category=קונסולות משחק&subcategory=נינטנדו' },
        ],
        variantFields: ['color', 'storage']
    },
    {
        name: 'מחשבים ניידים',
        subcategories: [
            { name: 'Apple MacBook', link: '/products?category=מחשבים ניידים&subcategory=Apple MacBook' },
            { name: 'Dell XPS', link: '/products?category=מחשבים ניידים&subcategory=Dell XPS' },
            { name: 'Lenovo', link: '/products?category=מחשבים ניידים&subcategory=Lenovo' },
        ],
        variantFields: ['color', 'storage']
    },
    {
        name: 'טלוויזיות',
        subcategories: [
            { name: 'LG', link: '/products?category=טלוויזיות&subcategory=LG' },
            { name: 'Samsung', link: '/products?category=טלוויזיות&subcategory=Samsung' },
            { name: 'Sony', link: '/products?category=טלוויזיות&subcategory=Sony' },
        ],
        variantFields: ['color', 'size']
    },
    {
        name: 'אוזניות',
        subcategories: [
            { name: 'אלחוטיות', link: '/products?category=אוזניות&subcategory=אלחוטיות' },
            { name: 'חוטיות', link: '/products?category=אוזניות&subcategory=חוטיות' },
            { name: 'ביטול רעשים', link: '/products?category=אוזניות&subcategory=ביטול רעשים' },
        ],
        variantFields: ['color']
    }
];

// Helper function to convert the array for the admin page
export const getAdminCategories = (categoriesArray) => {
    return categoriesArray.reduce((acc, current) => {
        acc[current.name] = current.subcategories.map(sub => sub.name);
        return acc;
    }, {});
};

// Helper function to get variant fields for the admin page
export const getAdminVariantFields = (categoriesArray) => {
    return categoriesArray.reduce((acc, current) => {
        acc[current.name] = current.variantFields;
        return acc;
    }, {});
};