const Store = require('../models/store');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get store by slug
// @route   GET /api/stores/:slug
// @access  Public
const getStoreBySlug = asyncHandler(async (req, res) => {
    const store = await Store.findOne({ slug: req.params.slug });
    
    if (store) {
        res.json(store);
    } else {
        res.status(404);
        throw new Error('Store not found');
    }
});

// @desc    Update store settings
// @route   PUT /api/stores
// @access  Private/Admin
const updateStore = asyncHandler(async (req, res) => {
    // req.storeId from storeResolver
    const store = await Store.findById(req.storeId);
    
    if (store) {
        store.name = req.body.name || store.name;
        store.businessInfo = req.body.businessInfo || store.businessInfo;
        store.design = req.body.design || store.design;
        store.labels = req.body.labels || store.labels;
        store.features = req.body.features || store.features;
        store.homePageConfig = req.body.homePageConfig || store.homePageConfig;
        store.gallery = req.body.gallery || store.gallery;
        store.shippingOptions = req.body.shippingOptions !== undefined ? req.body.shippingOptions : store.shippingOptions;

        const updatedStore = await store.save();
        res.json(updatedStore);
    } else {
        res.status(404);
        throw new Error('Store not found');
    }
});

// @desc    Get all stores
// @route   GET /api/stores
// @access  Private/SuperAdmin
const getAllStores = asyncHandler(async (req, res) => {
    const stores = await Store.find({});
    res.json(stores);
});

// @desc    Create a new store
// @route   POST /api/stores
// @access  Private/SuperAdmin
const createStore = asyncHandler(async (req, res) => {
    const { name, slug } = req.body;

    const storeExists = await Store.findOne({ slug });
    if (storeExists) {
        res.status(400);
        throw new Error('Store slug already exists');
    }

    const store = new Store({
        name,
        slug,
        features: { hasRepairLab: false },
        design: {
            primaryColor: '#0058be',
            secondaryColor: '#f8f9fb'
        }
    });

    const createdStore = await store.save();
    res.status(201).json(createdStore);
});

// @desc    Delete a store
// @route   DELETE /api/stores/:id
// @access  Private/SuperAdmin
const deleteStore = asyncHandler(async (req, res) => {
    const store = await Store.findById(req.params.id);

    if (store) {
        await Store.deleteOne({ _id: store._id });
        res.json({ message: 'Store removed' });
    } else {
        res.status(404);
        throw new Error('Store not found');
    }
});

module.exports = {
    getStoreBySlug,
    updateStore,
    getAllStores,
    createStore,
    deleteStore
};
