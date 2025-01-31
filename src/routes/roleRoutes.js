const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, roleController.createRole);
router.get('/', protect, roleController.getAllRoles);

module.exports = router;
