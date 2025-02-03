const { Product, StockMovement, Location, Category, User } = require('../models');
const { Op, Sequelize } = require('sequelize');
const logger = require('../config/logger');

const dashboardController = {
    getDashboardStats: async (req, res) => {
        try {
            const [
                totalProducts,
                lowStockProducts,
                recentProducts,
                recentMovements,
                activeLocations,
                categoryDistribution
            ] = await Promise.all([
                // Toplam ürün sayısı
                Product.count(),
                
                // Düşük stoklu ürünler
                Product.count({
                    where: {
                        quantity: {
                            [Op.lte]: Sequelize.col('minStockLevel')
                        }
                    }
                }),
                
                // Son eklenen ürünler
                Product.findAll({
                    attributes: ['id', 'name', 'sku', 'quantity', 'price'],
                    limit: 5,
                    order: [['createdAt', 'DESC']],
                    include: [{
                        model: Category,
                        attributes: ['name']
                    }]
                }),
                
                // Son hareketler
                StockMovement.findAll({
                    attributes: ['id', 'type', 'quantity', 'createdAt'],
                    limit: 10,
                    order: [['createdAt', 'DESC']],
                    include: [{
                        model: Product,
                        attributes: ['name', 'sku']
                    }]
                }),
                
                // Aktif lokasyonlar (geçici olarak tüm lokasyonları sayalım)
                Location.count(),
                
                // Kategori dağılımı
                Product.findAll({
                    attributes: [
                        [Sequelize.fn('COUNT', Sequelize.col('Product.id')), 'count']
                    ],
                    include: [{
                        model: Category,
                        attributes: ['name']
                    }],
                    group: ['Category.id', 'Category.name']
                })
            ]);

            res.json({
                success: true,
                data: {
                    totalProducts,
                    lowStockProducts,
                    recentProducts,
                    recentMovements,
                    activeLocations,
                    categoryDistribution
                }
            });

        } catch (error) {
            logger.error('Dashboard stats error:', error);
            res.status(500).json({
                success: false,
                message: 'İstatistikler alınırken bir hata oluştu'
            });
        }
    },

    getStockTrends: async (req, res) => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const trends = await StockMovement.findAll({
                attributes: [
                    [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
                    [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN type = 'IN' THEN quantity ELSE 0 END")), 'inbound'],
                    [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN type = 'OUT' THEN quantity ELSE 0 END")), 'outbound']
                ],
                where: {
                    createdAt: {
                        [Op.gte]: thirtyDaysAgo
                    }
                },
                group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
                order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']]
            });

            res.json({
                success: true,
                data: trends
            });
        } catch (error) {
            console.error('Stock trends error:', error);
            res.status(500).json({
                success: false,
                message: 'Stok trendleri alınırken bir hata oluştu'
            });
        }
    },

    getRecentMovements: async (req, res) => {
        try {
            const movements = await StockMovement.findAll({
                limit: 10,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: Product,
                        attributes: ['name', 'sku']
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['username']
                    }
                ]
            });

            res.json({
                success: true,
                data: movements
            });
        } catch (error) {
            console.error('Recent movements error:', error);
            res.status(500).json({
                success: false,
                message: 'Son hareketler alınırken bir hata oluştu'
            });
        }
    },

    getStats: async (req, res) => {
        try {
            const totalProducts = await Product.countDocuments()
            const totalUsers = await User.countDocuments()
            const lowStock = await Product.countDocuments({ stock: { $lt: 10 } })

            res.json({
                totalProducts,
                totalUsers,
                lowStock
            })
        } catch (error) {
            res.status(500).json({ message: 'Sunucu hatası' })
        }
    }
};

module.exports = dashboardController;
