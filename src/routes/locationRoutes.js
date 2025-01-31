const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, locationController.getAllLocations);
router.get('/3d-view', protect, locationController.get3DView);
router.post('/assign-product', protect, locationController.assignProduct);

module.exports = router; 