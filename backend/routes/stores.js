const express = require('express');
const router = express.Router();
const { 
    getStoreBySlug, 
    updateStore, 
    getAllStores, 
    createStore, 
    deleteStore 
} = require('../controllers/storeController');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');
const storeResolver = require('../middleware/storeResolver');

router.get('/', protect, superAdmin, getAllStores);
router.post('/', protect, superAdmin, createStore);
router.get('/:slug', getStoreBySlug);
// use storeResolver here because it's not applied to /api/stores in app.js
router.put('/', storeResolver, protect, admin, updateStore);
router.delete('/:id', protect, superAdmin, deleteStore);

module.exports = router;
