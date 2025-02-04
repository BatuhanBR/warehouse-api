const { Product, Category, User, StockMovement, sequelize } = require('../models');
const { Op, Sequelize } = require('sequelize');
const logger = require('../config/logger');

// Debug için
console.log('Product Model:', Product);
console.log('User Model:', User);

const productController = {
    getProducts: async (req, res) => {
        try {
            const products = await Product.findAll({
                attributes: [
                    'id', 'name', 'description', 'sku', 
                    'quantity', 'price', 'minStockLevel',
                    'categoryId', 'locationId', 'createdBy',
                    'position3D', 'createdAt', 'updatedAt'
                ],
                include: [
                    {
                        model: Category,
                        attributes: ['id', 'name']
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'username']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            res.json({ success: true, data: products });
        } catch (error) {
            console.error('Get products error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    },

    getProductById: async (req, res) => {
        try {
            const product = await Product.findByPk(req.params.id, {
                attributes: [
                    'id', 'name', 'description', 'sku', 
                    'quantity', 'price', 'minStockLevel',
                    'categoryId', 'locationId', 'position3D', 
                    'createdBy', 'createdAt', 'updatedAt'
                ],
                include: [
                    { 
                        model: User, 
                        as: 'creator', 
                        attributes: ['username', 'email'] 
                    }
                ]
            });
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Ürün bulunamadı'
                });
            }

            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    createProduct: async (req, res) => {
        try {
            const userId = req.user.id;
            
            console.log('-------- POSTMAN TEST --------');
            console.log('Gelen İstek:', {
                headers: req.headers,
                body: req.body,
                user: req.user
            });

            const productData = {
                name: req.body.name.trim(),
                sku: req.body.sku.trim(),
                description: req.body.description || '',
                quantity: parseInt(req.body.stock) || 0,
                price: parseFloat(req.body.price) || 0,
                minStockLevel: parseInt(req.body.minStock) || 0,
                categoryId: parseInt(req.body.categoryId || req.body.category),
                createdBy: userId
            };

            console.log('İşlenmiş Veri:', productData);

            const product = await Product.create(productData, {
                returning: ['id', 'name', 'description', 'sku', 'quantity', 'price', 
                            'minStockLevel', 'categoryId', 'locationId', 'position3D', 
                            'createdBy', 'createdAt', 'updatedAt']
            });
            console.log('Oluşturulan Ürün:', product.toJSON());

            res.status(201).json({
                success: true,
                message: 'Ürün başarıyla oluşturuldu',
                data: product
            });

        } catch (error) {
            console.error('Ürün Oluşturma Hatası:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                errors: error.errors,
                fullError: JSON.stringify(error, null, 2)
            });
            
            if (error.name === 'SequelizeValidationError' || 
                error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: 'Validasyon hatası',
                    errors: error.errors.map(err => ({
                        field: err.path,
                        message: err.message
                    }))
                });
            }

            res.status(500).json({
                success: false,
                message: 'Ürün oluşturulurken bir hata oluştu',
                error: error.message
            });
        }
    },

    updateProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            // Transaction başlat
            const transaction = await sequelize.transaction();

            try {
                const product = await Product.findByPk(id, {
                    attributes: [
                        'id', 'name', 'description', 'sku', 
                        'quantity', 'price', 'minStockLevel',
                        'categoryId', 'locationId', 'position3D', 
                        'createdBy', 'createdAt', 'updatedAt'
                    ],
                    transaction
                });

                if (!product) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        message: 'Ürün bulunamadı'
                    });
                }

                // updatedBy'ı kaldırdık
                const updatedProduct = await product.update(req.body, { transaction });

                // Transaction'ı onayla
                await transaction.commit();

                logger.info('Product updated', {
                    productId: id,
                    userId: userId,
                    action: 'update_product'
                });

                res.json({
                    success: true,
                    message: 'Ürün başarıyla güncellendi',
                    data: updatedProduct
                });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            logger.error('Update product error:', error);
            res.status(500).json({
                success: false,
                message: 'Ürün güncellenirken bir hata oluştu'
            });
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Transaction başlat
            const transaction = await sequelize.transaction();

            try {
                // Önce ürünü bul - sadece gerekli alanları seç
                const product = await Product.findByPk(id, {
                    attributes: [
                        'id', 'name', 'description', 'sku', 
                        'quantity', 'price', 'minStockLevel',
                        'categoryId', 'locationId', 'position3D', 
                        'createdBy', 'createdAt', 'updatedAt'
                    ],
                    transaction
                });
                
                if (!product) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        message: 'Ürün bulunamadı'
                    });
                }

                // İlişkili stok hareketlerini sil
                await StockMovement.destroy({
                    where: { productId: id },
                    transaction
                });

                // Sonra ürünü sil
                await product.destroy({ transaction });

                // Transaction'ı onayla
                await transaction.commit();

                res.json({
                    success: true,
                    message: 'Ürün başarıyla silindi'
                });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            logger.error('Delete product error:', error);
            res.status(500).json({
                success: false,
                message: 'Ürün silinirken bir hata oluştu'
            });
        }
    },

    // Ürün arama ve filtreleme
    searchProducts: async (req, res) => {
        try {
            const {
                search,         // SKU veya isim için arama
                minStock,       // Minimum stok miktarı
                maxStock,       // Maximum stok miktarı
                location,       // Lokasyon
                sortBy,         // Sıralama kriteri
                sortOrder      // Sıralama yönü (ASC/DESC)
            } = req.query;

            // Filtreleme koşulları
            const whereConditions = {};

            // SKU veya isim araması
            if (search) {
                whereConditions[Op.or] = [
                    { sku: { [Op.iLike]: `%${search}%` } },
                    { name: { [Op.iLike]: `%${search}%` } }
                ];
            }

            // Stok miktarı filtresi
            if (minStock || maxStock) {
                whereConditions.quantity = {};
                if (minStock) {
                    whereConditions.quantity[Op.gte] = parseInt(minStock, 10);
                }
                if (maxStock) {
                    whereConditions.quantity[Op.lte] = parseInt(maxStock, 10);
                }
            }

            // Lokasyon filtresi
            if (location) {
                whereConditions.location = { [Op.iLike]: `%${location}%` };
            }

            // Sıralama seçenekleri
            const order = [];
            if (sortBy) {
                order.push([sortBy, (sortOrder || 'ASC').toUpperCase()]);
            }

            // Ürünleri getir
            const products = await Product.findAll({
                where: whereConditions,
                order: order.length ? order : [['createdAt', 'DESC']]
            });

            res.json({
                success: true,
                count: products.length,
                data: products
            });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Düşük stok raporu
    getLowStockReport: async (req, res) => {
        try {
            const { threshold = 10 } = req.query; // Varsayılan kritik stok seviyesi: 10

            const lowStockProducts = await Product.findAll({
                where: {
                    quantity: {
                        [Op.lt]: parseInt(threshold, 10)
                    }
                },
                attributes: [
                    'id',
                    'name',
                    'sku',
                    'quantity',
                    'price',
                    'location',
                    'createdAt',
                    'updatedAt',
                    [
                        Sequelize.literal('CASE WHEN quantity = 0 THEN \'Stokta Yok\' WHEN quantity < 5 THEN \'Kritik\' ELSE \'Az\' END'),
                        'stockStatus'
                    ]
                ],
                order: [
                    ['quantity', 'ASC'],
                    ['name', 'ASC']
                ]
            });

            // Özet istatistikler
            const summary = {
                totalLowStock: lowStockProducts.length,
                outOfStock: lowStockProducts.filter(p => p.quantity === 0).length,
                critical: lowStockProducts.filter(p => p.quantity > 0 && p.quantity < 5).length,
                low: lowStockProducts.filter(p => p.quantity >= 5).length
            };

            res.json({
                success: true,
                summary,
                data: lowStockProducts
            });
        } catch (error) {
            console.error('Low stock report error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getStockValueReport: async (req, res) => {
        try {
            // Tüm ürünleri ve değerlerini getir
            const products = await Product.findAll({
                attributes: [
                    'id',
                    'name',
                    'sku',
                    'quantity',
                    'price',
                    'location',
                    [Sequelize.literal('price * quantity'), 'totalValue']
                ],
                order: [
                    [Sequelize.literal('price * quantity'), 'DESC']
                ]
            });

            // Özet istatistikler
            const summary = {
                totalProducts: products.length,
                totalItems: products.reduce((sum, p) => sum + p.quantity, 0),
                totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
                averageValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0) / products.length,
                highestValue: Math.max(...products.map(p => p.price * p.quantity)),
                lowestValue: Math.min(...products.map(p => p.price * p.quantity))
            };

            // Lokasyon bazında değerler
            const locationValues = {};
            products.forEach(product => {
                const location = product.location || 'Belirtilmemiş';
                if (!locationValues[location]) {
                    locationValues[location] = {
                        totalValue: 0,
                        itemCount: 0,
                        products: []
                    };
                }
                locationValues[location].totalValue += product.price * product.quantity;
                locationValues[location].itemCount += product.quantity;
                locationValues[location].products.push({
                    id: product.id,
                    name: product.name,
                    value: product.price * product.quantity
                });
            });

            // En değerli 5 ürün
            const topProducts = products
                .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
                .slice(0, 5);

            res.json({
                success: true,
                summary,
                locationAnalysis: locationValues,
                topValueProducts: topProducts,
                allProducts: products
            });
        } catch (error) {
            console.error('Stock value report error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    bulkUpdateProducts: async (req, res) => {
        const { products } = req.body;
        // Toplu güncelleme işlemi
    },

    // Toplu silme işlemi
    bulkDeleteProducts: async (req, res) => {
        try {
            const { productIds } = req.body;
            
            await Product.destroy({
                where: {
                    id: {
                        [Op.in]: productIds
                    }
                }
            });

            res.json({
                success: true,
                message: `${productIds.length} ürün başarıyla silindi`
            });
        } catch (error) {
            console.error('Bulk delete error:', error);
            res.status(500).json({
                success: false,
                error: 'Ürünler silinirken bir hata oluştu'
            });
        }
    }
};

module.exports = productController;