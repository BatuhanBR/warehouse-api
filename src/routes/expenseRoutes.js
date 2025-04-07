const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const auth = require('../middleware/auth');

// Tüm rotalar için authentication gerekli
router.use(auth);

// Gider listesi ve özet bilgileri
router.get('/', expenseController.getAllExpenses);

// Yeni gider oluştur
router.post('/', expenseController.createExpense);

// Excel export
router.get('/export/excel', expenseController.exportToExcel);

// PDF export
router.get('/export/pdf', expenseController.exportToPdf);

// Gider güncelle
router.put('/:id', expenseController.updateExpense);

// Gider sil
router.delete('/:id', expenseController.deleteExpense);

module.exports = router; 