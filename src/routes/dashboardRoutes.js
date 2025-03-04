const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// Debug log'unu kaldıralım
// console.log('Dashboard Controller:', dashboardController);

// Route'ları tanımlayalım
router.get('/summary', auth, dashboardController.getSummaryCards);
router.get('/stats', auth, dashboardController.getDashboardStats);
router.get('/trends', auth, dashboardController.getStockTrends);
router.get('/predictions', auth, (req, res) => dashboardController.getPredictions(req, res));
router.get('/recent-movements', auth, dashboardController.getRecentMovements);
router.get('/critical-stock', auth, dashboardController.getCriticalStock);
router.get('/popular-products', auth, dashboardController.getPopularProducts);

module.exports = router;
