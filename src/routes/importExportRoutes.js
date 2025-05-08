const express = require('express');
const router = express.Router();
const importExportController = require('../controllers/importExportController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

// Dosya yükleme konfigürasyonu
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.xlsx');
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Sadece Excel dosyaları yüklenebilir!'));
        }
    }
});

// Routes
router.post('/import/products', protect, upload.single('file'), importExportController.importProducts);
router.get('/export/products', protect, importExportController.exportProducts);
router.get('/export/stock-movements', protect, importExportController.exportStockMovements);
router.get('/export/inventory-report', protect, importExportController.exportInventoryReport);

module.exports = router;  // router'ı export ediyoruz 