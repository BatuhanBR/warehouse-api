const express = require('express');
const router = express.Router();
const rackController = require('../controllers/rackController');
const { authenticateToken } = require('../middleware/auth');

// Debug için route'ları kaydet
console.log('Rack routes loaded with:');
console.log(' - GET /, getRacks');
console.log(' - GET /:rackNumber/cells, getRackCells');

// Talep geldiğinde loglama middleware'i
const logRequest = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    next();
};

// Tüm rafları getir
router.get('/', authenticateToken, logRequest, rackController.getRacks);

// Belirli bir rafın hücrelerini getir
router.get('/:rackNumber/cells', authenticateToken, logRequest, rackController.getRackCells);

module.exports = router; 