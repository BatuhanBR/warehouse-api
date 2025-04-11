const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { uploadProfilePicture } = require('../middleware/uploadMiddleware');

// Public rotalar
router.post('/login', userController.login);

// Protected rotalar
router.get('/me', authMiddleware, userController.getCurrentUser);
router.put('/me/profile-picture', authMiddleware, uploadProfilePicture, userController.uploadProfilePicture);
router.get('/', authMiddleware, adminMiddleware, userController.getUsers);
router.post('/', authMiddleware, adminMiddleware, userController.createUser);
router.put('/:id', authMiddleware, adminMiddleware, userController.updateUser);
router.delete('/:id', authMiddleware, adminMiddleware, userController.deleteUser);
router.post('/:id/reset-password', authMiddleware, adminMiddleware, userController.resetPassword);
router.get('/:id/activities', authMiddleware, adminMiddleware, userController.getUserActivities);

module.exports = router;
