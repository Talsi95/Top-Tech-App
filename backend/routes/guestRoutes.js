const router = require('express').Router();
const { handleRequestOTP, handleVerifyOTP, verifyFirebaseAndSyncGuest } = require('../controllers/guestController');
const asyncHandler = require('../middleware/asyncHandler');

router.post('/request-verify-otp', asyncHandler(handleRequestOTP));
router.post('/verify-otp', asyncHandler(handleVerifyOTP));
router.post('/verify-firebase', verifyFirebaseAndSyncGuest);
module.exports = router;


