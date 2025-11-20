const router = require('express').Router();
const { handleRequestOTP, handleVerifyOTP } = require('../controllers/guestController');
const asyncHandler = require('../middleware/asyncHandler');

router.post('/request-verify-otp', asyncHandler(handleRequestOTP));
router.post('/verify-otp', asyncHandler(handleVerifyOTP));

module.exports = router;


