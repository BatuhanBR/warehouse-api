const { Category, Product } = require('../models');
const logger = require('../config/logger');

// Kategori oluşturma
exports.createCategory = async (req, res) => {
    try {
        const categoryData = {
            name: req.body.name,
            description: req.body.description,
            createdBy: 1, // Şimdilik sabit bir değer kullanıyoruz
            updatedBy: 1  // Şimdilik sabit bir değer kullanıyoruz
        };

        const category = await Category.create(categoryData);

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Category creation error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Tüm kategorileri listeleme
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            include: [{
                model: Product,
                attributes: ['id', 'name']
            }]
        });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Kategori güncelleme
exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategori bulunamadı'
            });
        }

        const updateData = {
            name: req.body.name,
            description: req.body.description,
            updatedBy: 1 // Şimdilik sabit bir değer kullanıyoruz
        };

        await category.update(updateData);

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Kategori silme
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategori bulunamadı'
            });
        }

        // Önce bu kategorideki ürünlerin kategorisini null yap
        await Product.update(
            { categoryId: null },
            { where: { categoryId: category.id } }
        );

        await category.destroy();

        res.json({
            success: true,
            message: 'Kategori başarıyla silindi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Basit kategori listesi (dropdown için)
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
        });

        // Debug için kategorileri logla
        console.log('Bulunan kategoriler:', categories);

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Kategori getirme hatası:', error);
        logger.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Kategoriler getirilirken bir hata oluştu'
        });
    }
};
