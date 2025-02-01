const Product = require('../models/product');
const User = require('../models/user');
const { Op } = require('sequelize');
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
            const reports = await analyticsService.generateReports();
            res.json({
                success: true,
                data: reports
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Trend analizi
    getTrends: async (req, res) => {
        try {
            const { days } = req.query;
            const trends = await analyticsService.calculateTrends(parseInt(days) || 30);
            res.json({
                success: true,
                data: trends
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Stok tahminleri
    getPredictions: async (req, res) => {
        try {
            const predictions = await analyticsService.predictStockNeeds();
            res.json({
                success: true,
                data: predictions
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

// Controller'ı export edelim
module.exports = dashboardController;
