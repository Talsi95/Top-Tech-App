const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, admin } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const { register, login, forgotPassword, resetPassword, profile, getAllUsers } = require('../controllers/userController');

const registerValidationRules = [
    body('username')
        .isLength({ min: 3 })
        .withMessage('שם המשתמש חייב להיות באורך 3 תווים לפחות'),
    body('email')
        .isEmail()
        .withMessage('אנא הזן כתובת אימייל תקינה'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('הסיסמה חייבת להיות באורך 6 תווים לפחות'),
];

const loginValidationRules = [
    body('email').isEmail().withMessage('אנא הזן כתובת אימייל תקינה'),
    body('password').exists().withMessage('נדרש סיסמה להתחברות'),
];

router.post('/register', registerValidationRules, asyncHandler(register));

router.post('/login', loginValidationRules, asyncHandler(login));

router.post('/forgot-password', asyncHandler(forgotPassword));

router.post('/reset-password', asyncHandler(resetPassword));

router.get('/profile', protect, asyncHandler(profile));

router.get('/', protect, admin, asyncHandler(getAllUsers));

module.exports = router;
