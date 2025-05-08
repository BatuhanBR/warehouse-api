const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stockMovementController = require('../controllers/stockMovementController');

// Stok hareketleri route'ları
router.get('/', auth, (req, res) => stockMovementController.getStockMovements(req, res));
router.post('/', auth, (req, res) => stockMovementController.createStockMovement(req, res));
router.get('/:id', auth, (req, res) => stockMovementController.getStockMovement(req, res));
router.get('/product/:productId', auth, (req, res) => stockMovementController.getProductMovements(req, res));
router.get('/date-range', auth, (req, res) => stockMovementController.getMovementsByDateRange(req, res));

module.exports = router; 