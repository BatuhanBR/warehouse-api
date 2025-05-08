const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Tüm rotalar için authentication gerekli
router.use(auth);

// Gider listesi ve özet bilgileri
router.get('/', admin, expenseController.getAllExpenses);

// Yeni gider oluştur
router.post('/', admin, expenseController.createExpense);

// Excel export
router.get('/export/excel', expenseController.exportToExcel);

// PDF export
router.get('/export/pdf', expenseController.exportToPdf);

// Gider güncelle
router.put('/:id', admin, expenseController.updateExpense);

// Gider sil
router.delete('/:id', admin, expenseController.deleteExpense);

// // Giderleri filtrele/raporla (Örnek bir endpoint, kontrolcüde ilgili fonksiyon olmalı)
// router.get('/report/filter', admin, expenseController.filterExpenses); // Şimdilik kaldırıldı veya kontrolcüde fonksiyon yok

module.exports = router; 