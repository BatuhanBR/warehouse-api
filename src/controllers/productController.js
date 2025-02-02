const { Product, User, Category } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const Sequelize = require('sequelize');
const logger = require('../config/logger');

// Debug için
console.log('Product Model:', Product);
console.log('User Model:', User);

const productController = {
    getProducts: async (req, res) => {
        try {
            const products = await Product.findAll({
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'email']
                    },
                    {
                        model: User,
                        as: 'updater',
                        attributes: ['id', 'email']
                    },
                    {
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'name']
                    }
                ]
            });

            res.json({
                success: true,
                data: products
            });
        } catch (error) {
            console.error('Get products error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getProductById: async (req, res) => {
        try {
            const product = await Product.findByPk(req.params.id, {
                include: [
                    { model: User, as: 'creator', attributes: ['username', 'email'] },
                    { model: User, as: 'updater', attributes: ['username', 'email'] }
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
            const product = await Product.create(req.body);
            
            logger.info('Product created', {
                productId: product.id,
                userId: req.user.id,
                action: 'create_product'
            });

            res.status(201).json({
                success: true,
                data: product
            });
        } catch (error) {
            logger.error('Product creation failed', {
                error: error.message,
                userId: req.user.id
            });
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    updateProduct: async (req, res) => {
        try {
            const product = await Product.findByPk(req.params.id);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Ürün bulunamadı'
                });
            }

            // Ürünü güncelle
            await product.update({
                ...req.body,
                updatedBy: 1 // Şimdilik sabit değer
            });

            // Güncellenmiş ürünü ilişkileriyle birlikte getir
            const updatedProduct = await Product.findByPk(product.id, {
                include: [
                    { model: User, as: 'creator', attributes: ['username', 'email'] },
                    { model: User, as: 'updater', attributes: ['username', 'email'] }
                ]
            });

            res.json({
                success: true,
                data: updatedProduct
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const product = await Product.findByPk(req.params.id);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Ürün bulunamadı'
                });
            }

            await product.destroy();

            res.json({
                success: true,
                message: 'Ürün başarıyla silindi'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
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
                        sequelize.literal('CASE WHEN quantity = 0 THEN \'Stokta Yok\' WHEN quantity < 5 THEN \'Kritik\' ELSE \'Az\' END'),
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
    }
};

module.exports = productController;