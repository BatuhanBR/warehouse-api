const express = require('express');
const router = express.Router();
const shelfController = require('../controllers/shelfController');
const auth = require('../middleware/auth');

// Debug için route'ları kaydet
console.log('Shelf routes loaded with:');
console.log(' - GET /, getShelves');
console.log(' - POST /place-product, placeProduct');
console.log(' - DELETE /remove-product/:cellProductId, removeProduct');

// Talep geldiğinde loglama middleware'i
const logRequest = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    next();
};

// Tüm rafları ve içindeki ürünleri getir
router.get('/', auth, logRequest, shelfController.getShelves);

// Ürünü rafa yerleştir
router.post('/place-product', auth, logRequest, shelfController.placeProduct);

// Ürünü raftan kaldır
router.delete('/remove-product/:cellProductId', auth, logRequest, shelfController.removeProduct);

module.exports = router; 