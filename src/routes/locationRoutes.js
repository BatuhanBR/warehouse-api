const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { location: locationSchema } = require('../validations/schemas');

router.get('/', protect, locationController.getAllLocations);
router.get('/3d-view', protect, locationController.get3DView);
router.post('/', 
    protect, 
    validateRequest(locationSchema.create),
    locationController.createLocation
);
router.post('/assign-product', 
    protect, 
    validateRequest(locationSchema.assignProduct),
    locationController.assignProduct
);

module.exports = router; 