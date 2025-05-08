const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, categoryController.createCategory);
router.get('/', protect, categoryController.getAllCategories);
router.put('/:id', protect, categoryController.updateCategory);
router.delete('/:id', protect, categoryController.deleteCategory);
router.get('/list', protect, categoryController.getCategories);

module.exports = router;
