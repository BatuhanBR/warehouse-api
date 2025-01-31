const express = require('express');
const router = express.Router();
const stockAlertController = require('../controllers/stockAlertController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, stockAlertController.getStockAlerts);
router.get('/critical', protect, stockAlertController.getCriticalStock);
router.put('/:productId/min-level', protect, stockAlertController.updateMinStockLevel);

module.exports = router;