const { Product, StockMovement, Location, Category, User } = require('../models');
const { Op, Sequelize } = require('sequelize');
const analyticsService = require('../services/analyticsService');

// Controller fonksiyonlarını bir obje içinde toplayalım
const dashboardController = {
    getDashboardStats: async (req, res) => {
        try {
            // Toplam ürün sayısı
            const totalProducts = await Product.count();
            
            // Stok sayısı düşük olan ürünler (örneğin 10'dan az)
            const lowStockProducts = await Product.count({
                where: {
                    quantity: {
                        [Op.lt]: 10
                    }
                }
            });

            // Son eklenen ürünler (son 5)
            const recentProducts = await Product.findAll({
                limit: 5,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['username']
                    },
                    {
                        model: User,
                        as: 'updater',
                        attributes: ['username']
                    }
                ]
            });

            res.json({
                success: true,
                data: {
                    totalProducts,
                    lowStockProducts,
                    recentProducts
                }
            });
        } catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Temel istatistikler
    getStats: async (req, res) => {
        try {
            const totalProducts = await Product.count();
            const lowStock = await Product.count({
                where: {
                    quantity: {
                        [Op.lt]: Sequelize.col('minStockLevel')
                    }
                }
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dailyMovements = await StockMovement.count({
                where: {
                    createdAt: {
                        [Op.gte]: today
                    }
                }
            });

            const activeLocations = await Location.count({
                where: {
                    status: {
                        [Op.ne]: 'empty'
                    }
                }
            });

            res.json({
                success: true,
                data: {
                    totalProducts,
                    lowStock,
                    dailyMovements,
                    activeLocations
                }
            });
        } catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({
                success: false,
                message: 'İstatistikler alınırken bir hata oluştu'
            });
        }
    },

    // Trend analizi
    getTrends: async (req, res) => {
        try {
            // Son 7 günlük trend analizi
            const trends = await StockMovement.findAll({
                attributes: [
                    [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
                    [Sequelize.fn('COUNT', '*'), 'count'],
                    'type'
                ],
                where: {
                    createdAt: {
                        [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
                    }
                },
                group: ['date', 'type'],
                order: [['date', 'ASC']]
            });

            res.json({
                success: true,
                data: trends
            });
        } catch (error) {
            console.error('Trend analysis error:', error);
            res.status(500).json({
                success: false,
                message: 'Trend analizi alınırken bir hata oluştu'
            });
        }
    },

    // Stok tahminleri
    getPredictions: async (req, res) => {
        try {
            // Basit stok tahminleri
            const predictions = await Product.findAll({
                where: {
                    quantity: {
                        [Op.lt]: Sequelize.col('minStockLevel')
                    }
                },
                include: [
                    {
                        model: Category,
                        attributes: ['name']
                    }
                ]
            });

            res.json({
                success: true,
                data: predictions
            });
        } catch (error) {
            console.error('Predictions error:', error);
            res.status(500).json({
                success: false,
                message: 'Tahminler alınırken bir hata oluştu'
            });
        }
    },

    getRecentMovements: async (req, res) => {
        try {
            const movements = await StockMovement.findAll({
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
                ],
                order: [['createdAt', 'DESC']],
                limit: 10
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
    }
};

// Controller'ı export edelim
module.exports = dashboardController;
