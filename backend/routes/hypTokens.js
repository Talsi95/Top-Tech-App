const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const { getUserTokens, deleteToken } = require('../controllers/hypTokenController');

router.get('/saved-cards', protect, asyncHandler(getUserTokens));
router.delete('/saved-cards/:id', protect, asyncHandler(deleteToken));

module.exports = router;