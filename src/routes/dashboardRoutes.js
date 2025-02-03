const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// Debug log'unu kaldıralım
// console.log('Dashboard Controller:', dashboardController);

// Route'ları tanımlayalım
router.get('/stats', auth, dashboardController.getDashboardStats);
router.get('/trends', auth, dashboardController.getStockTrends);
router.get('/predictions', auth, (req, res) => dashboardController.getPredictions(req, res));
router.get('/recent-movements', auth, dashboardController.getRecentMovements);

module.exports = router;
