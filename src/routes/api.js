const express = require('express');
const router = express.Router();
const { storageRateController } = require('../controllers');

// Storage Rates Routes
router.get('/storage-rates/by-category/:categoryId', storageRateController.getStorageRateByCategory);

module.exports = router; 