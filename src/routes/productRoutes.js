const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { product: productSchema } = require('../validations/schemas');

// Arama route'u en üstte olmalı (çünkü özel bir route)
router.get('/search', protect, productController.searchProducts);

// Rapor route'ları
router.get('/reports/low-stock', protect, productController.getLowStockReport);
router.get('/reports/stock-value', protect, productController.getStockValueReport);

// Temel CRUD route'ları
router.get('/', protect, productController.getProducts);
router.post('/', 
    protect, 
    validateRequest(productSchema.create),
    productController.createProduct
);
router.get('/:id', protect, productController.getProductById);
router.put('/:id', 
    protect, 
    validateRequest(productSchema.update),
    productController.updateProduct
);
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router;