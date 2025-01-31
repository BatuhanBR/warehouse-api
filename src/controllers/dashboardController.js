const Product = require('../models/product');
const User = require('../models/user');
const { Op } = require('sequelize');

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
                include: [{
                    model: User,
                    as: 'creator',
                    attributes: ['username']
                }]
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
    }
};

// Controller'ı export edelim
module.exports = dashboardController;
