const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Debug log'unu kaldıralım
// console.log('Dashboard Controller:', dashboardController);

// Route'ları tanımlayalım
router.get('/summary', auth, admin, dashboardController.getSummaryCards);
router.get('/stats', auth, admin, dashboardController.getDashboardStats);
router.get('/trends', auth, admin, dashboardController.getStockTrends);
router.get('/predictions', auth, admin, (req, res) => dashboardController.getPredictions(req, res));
router.get('/recent-movements', auth, admin, dashboardController.getRecentMovements);
router.get('/critical-stock', auth, admin, dashboardController.getCriticalStock);
router.get('/popular-products', auth, admin, dashboardController.getPopularProducts);
router.get('/product-stats', auth, admin, dashboardController.getProductStats);
router.get('/category-distribution', auth, admin, dashboardController.getCategoryDistribution);
router.get('/monthly-movements', auth, admin, dashboardController.getMonthlyProductMovements);
router.get('/total-stock-status', auth, admin, dashboardController.getTotalStockStatus);
router.get('/warehouse-occupancy', auth, admin, dashboardController.getWarehouseOccupancy);
router.get('/low-stock-products', auth, admin, dashboardController.getLowStockProducts);
router.get('/daily-movement-details', auth, admin, dashboardController.getDailyMovementDetails);
router.get('/top-valued-products', auth, admin, dashboardController.getTopValuedProducts);
router.get('/expense-summary', auth, admin, dashboardController.getExpenseSummary);
router.get('/revenue-summary', auth, admin, dashboardController.getRevenueSummary);
router.get('/product-price-analysis', auth, admin, dashboardController.getProductPriceAnalysis);

module.exports = router;
