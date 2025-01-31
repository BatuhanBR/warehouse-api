const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public rotalar
router.post('/login', userController.login);
router.post('/register', userController.register);

// Protected rotalar
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);

module.exports = router;
