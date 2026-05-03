const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const {
    createRepair,
    getAllRepairs,
    updateRepairStatus,
    getRepairStatusByPhone
} = require('../controllers/repairController');

// Admin routes
router.post('/', protect, admin, asyncHandler(createRepair));
router.get('/', protect, admin, asyncHandler(getAllRepairs));
router.put('/:id/status', protect, admin, asyncHandler(updateRepairStatus));

// Public routes
router.get('/status/:phone', asyncHandler(getRepairStatusByPhone));

module.exports = router;
