const Store = require('../models/store');

const storeResolver = async (req, res, next) => {
    // 1. First try to get slug from headers (x-store-slug)
    // 2. Fallback to req.query or req.params if needed (though headers are preferred)
    const slug = req.headers['x-store-slug'];
    
    if (!slug) {
        return res.status(400).json({ message: 'Store slug is missing from headers' });
    }

    try {
        const store = await Store.findOne({ slug });
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        req.storeId = store._id;
        req.store = store; // attach store object if needed
        next();
    } catch (error) {
        console.error('Error resolving store:', error);
        res.status(500).json({ message: 'Server error while resolving store' });
    }
};

module.exports = storeResolver;
