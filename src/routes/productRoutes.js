const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { product: productSchema } = require('../validations/schemas');

// Temel CRUD route'ları
router.get('/', auth, productController.getProducts);
router.post('/', auth, validateRequest(productSchema.create), productController.createProduct);
router.put('/:id', auth, validateRequest(productSchema.update), productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);

// Toplu silme endpoint'ini ekleyelim
router.post('/bulk-delete', auth, productController.bulkDelete);

module.exports = router;