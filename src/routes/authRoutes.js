const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const { user: userSchema } = require('../validations/schemas');

router.post('/register', 
    validateRequest(userSchema.register),
    authController.register
);

router.post('/login', 
    validateRequest(userSchema.login),
    authController.login
);

module.exports = router;