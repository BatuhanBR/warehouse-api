const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const { user: userSchema } = require('../validations/schemas');
const auth = require('../middleware/auth');

router.post('/register', authController.register);

router.post('/login', 
    validateRequest(userSchema.login),
    authController.login
);

router.post('/forgot-password',
  validateRequest(userSchema.forgotPassword),
  authController.forgotPassword
);

router.post('/reset-password',
  validateRequest(userSchema.resetPassword),
  authController.resetPassword
);

router.get('/me', auth, authController.me);

module.exports = router;