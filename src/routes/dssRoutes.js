const express = require('express');
const dssController = require('../controllers/dssController');
console.log('Imported dssController:', dssController); // Import edilen objeyi logla
const { authenticateToken, authorizeRole } = require('../middleware/auth'); // Auth middleware'ını ekle

const router = express.Router();

// Önerileri getiren endpoint (Erişim kontrolü eklenebilir, örn: sadece adminler)
router.get(
    '/recommendations',
    // authenticateToken, // <<-- GEÇİCİ OLARAK DEVRE DIŞI BIRAKILDI
    // authorizeRole(['admin', 'manager']), // Gerekirse belirli rollerle sınırla
    dssController.getRecommendations
);

module.exports = router; 