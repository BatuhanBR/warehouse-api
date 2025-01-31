const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { stockMovement: stockSchema } = require('../validations/schemas');

// Stok hareketleri route'ları
router.get('/', protect, stockController.getStockMovements);
router.post('/movement', 
    protect, 
    validateRequest(stockSchema.create),
    stockController.createStockMovement
);
router.get('/product/:productId', protect, stockController.getProductStockMovements);
router.get('/summary', protect, stockController.getStockSummary);
router.post('/add', protect, stockController.addStock);
router.post('/remove', protect, stockController.removeStock);
router.get('/report', protect, stockController.getStockMovementReport);

module.exports = router;