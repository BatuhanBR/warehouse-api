const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const auth = require('../middleware/auth');

// Tüm lokasyonları getir
router.get('/', auth, locationController.getLocations);

// Belirli bir rafın lokasyonlarını getir
router.get('/rack/:rackNumber', auth, locationController.getRackLocations);

module.exports = router; 