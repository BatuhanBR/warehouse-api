const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const auth = require('../middleware/auth');

// Tüm lokasyonları getir
router.get('/', auth, locationController.getLocations);

// Belirli bir rafın lokasyonlarını getir
router.get('/rack/:rackNumber', auth, locationController.getRackLocations);

// Tüm rafları getir (raf numaralarını)
router.get('/racks', auth, locationController.getRacks);

// Belirli bir raf numarasının hücrelerini getir
router.get('/racks/:rackNumber/cells', auth, locationController.getRackCells);

// Konum kodu ile lokasyonu getir
router.get('/code/:code', auth, locationController.getLocationByCode);

// Lokasyon güncelleme (ürün ekleme/çıkarma)
router.post('/update', auth, locationController.updateLocation);

// API'ımıza hoş geldiniz mesajı 
router.get('/info', (req, res) => {
  res.json({ message: 'Lokasyon API çalışıyor' });
});

module.exports = router; 