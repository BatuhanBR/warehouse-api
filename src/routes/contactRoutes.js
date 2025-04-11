const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
// İsteğe bağlı olarak buraya kimlik doğrulama middleware'i eklenebilir
// const auth = require('../middleware/auth'); 

// İletişim formu gönderme rotası
// POST /api/contact/send
router.post('/send', contactController.sendContactEmail);

module.exports = router; 