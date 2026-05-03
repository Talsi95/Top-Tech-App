const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const {
    getAllRepairTypes,
    createRepairType,
    updateRepairType,
    deleteRepairType
} = require('../controllers/repairTypeController');

// Public routes
router.get('/', asyncHandler(getAllRepairTypes));

// Admin routes
router.post('/', protect, admin, asyncHandler(createRepairType));
router.put('/:id', protect, admin, asyncHandler(updateRepairType));
router.delete('/:id', protect, admin, asyncHandler(deleteRepairType));

module.exports = router;
