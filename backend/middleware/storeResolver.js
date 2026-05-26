const Store = require('../models/store');

const storeResolver = async (req, res, next) => {
    try {
        const incomingHost = req.headers.host || '';

        let store = null;

        const isMainPlatform =
            incomingHost.includes('localhost') ||
            incomingHost.includes('onrender.com') ||
            incomingHost.includes('top-tech.co.il');

        if (isMainPlatform) {
            const slug = req.headers['x-store-slug'];

            if (!slug) {
                return res.status(400).json({ message: 'Store slug is missing from headers' });
            }

            store = await Store.findOne({ slug });
        } else {
            const cleanDomain = incomingHost.replace('www.', '').split(':')[0];
            store = await Store.findOne({ customDomain: cleanDomain });
        }

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }
        req.storeId = store._id;
        req.store = store;

        next();

    } catch (error) {
        console.error('Error resolving store:', error);
        res.status(500).json({ message: 'Server error while resolving store' });
    }
};

module.exports = storeResolver;
