const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// Önce controller'ın doğru yüklendiğinden emin olalım
console.log('Dashboard Controller:', dashboardController);

// Dashboard yetkisi olan roller erişebilir
router.get('/stats', protect, dashboardController.getStats);
router.get('/trends', protect, dashboardController.getTrends);
router.get('/predictions', protect, dashboardController.getPredictions);

module.exports = router;
