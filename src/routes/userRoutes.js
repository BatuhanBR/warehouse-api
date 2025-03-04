const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Public rotalar
router.post('/login', userController.login);
router.post('/register', userController.register);

// Protected rotalar
router.get('/', auth, userController.getUsers);
router.post('/', auth, userController.createUser);
router.put('/:id', auth, userController.updateUser);
router.delete('/:id', auth, userController.deleteUser);
router.post('/:id/reset-password', auth, userController.resetPassword);
router.get('/:id/activities', auth, userController.getUserActivities);

module.exports = router;
