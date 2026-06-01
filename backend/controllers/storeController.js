const Store = require('../models/store');
const asyncHandler = require('../middleware/asyncHandler');
const { generateLegalDocument, DEFAULT_TERMS, DEFAULT_PRIVACY } = require('../utils/legalTemplates');

// @desc    Get store by slug
// @route   GET /api/stores/:slug
// @access  Public
const getStoreBySlug = asyncHandler(async (req, res) => {
    const store = await Store.findOne({ slug: req.params.slug });

    if (store) {
        const storeObj = store.toObject();

        if (!storeObj.legal) {
            storeObj.legal = {
                termsOfService: '',
                privacyPolicy: '',
                useDefaultPrivacy: true,
                useDefaultTerms: true
            };
        }

        if (storeObj.legal.useDefaultTerms !== false || !storeObj.legal.termsOfService || storeObj.legal.termsOfService.trim() === '') {
            storeObj.legal.termsOfService = generateLegalDocument(DEFAULT_TERMS, storeObj);
        }
        if (storeObj.legal.useDefaultPrivacy !== false || !storeObj.legal.privacyPolicy || storeObj.legal.privacyPolicy.trim() === '') {
            storeObj.legal.privacyPolicy = generateLegalDocument(DEFAULT_PRIVACY, storeObj);
        }

        res.json(storeObj);
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
        store.customDomain = req.body.customDomain || store.customDomain;
        store.businessInfo = req.body.businessInfo || store.businessInfo;
        store.legal = req.body.legal || store.legal;
        store.design = req.body.design || store.design;
        store.labels = req.body.labels || store.labels;
        store.features = req.body.features || store.features;
        store.homePageConfig = req.body.homePageConfig || store.homePageConfig;
        store.gallery = req.body.gallery || store.gallery;
        store.shippingOptions = req.body.shippingOptions !== undefined ? req.body.shippingOptions : store.shippingOptions;
        store.paymentSettings = req.body.paymentSettings || store.paymentSettings;
        store.invoiceSettings = req.body.invoiceSettings || store.invoiceSettings;
        store.integrations = req.body.integrations || store.integrations;
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
        },
        legal: {
            termsOfService: '',
            privacyPolicy: '',
            useDefaultPrivacy: true,
            useDefaultTerms: true,
            showCookieBanner: true
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

// @desc    Get all public stores info
// @route   GET /api/stores/public-list
// @access  Public
const getPublicStores = asyncHandler(async (req, res) => {
    const stores = await Store.find({}, 'slug name design businessInfo');
    res.json(stores);
});

module.exports = {
    getStoreBySlug,
    updateStore,
    getAllStores,
    createStore,
    deleteStore,
    getPublicStores
};
