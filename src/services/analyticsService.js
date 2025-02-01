const { sequelize } = require('../models');
const Product = require('../models/product');
const StockMovement = require('../models/stockMovement');
const { Op } = require('sequelize');

const analyticsService = {
    // Stok trendlerini hesapla
    calculateTrends: async (days = 30) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const movements = await StockMovement.findAll({
            where: {
                createdAt: {
                    [Op.gte]: startDate
                }
            },
            include: [{
                model: Product,
                as: 'Product',
                attributes: ['name', 'sku']
            }],
            order: [['createdAt', 'ASC']]
        });

        // Günlük hareketleri grupla
        const dailyMovements = {};
        movements.forEach(movement => {
            const date = movement.createdAt.toISOString().split('T')[0];
            if (!dailyMovements[date]) {
                dailyMovements[date] = {
                    inbound: 0,
                    outbound: 0,
                    total: 0
                };
            }

            if (movement.type === 'IN') {
                dailyMovements[date].inbound += movement.quantity;
                dailyMovements[date].total += movement.quantity;
            } else {
                dailyMovements[date].outbound += movement.quantity;
                dailyMovements[date].total -= movement.quantity;
            }
        });

        return Object.entries(dailyMovements).map(([date, data]) => ({
            date,
            ...data
        }));
    },

    // Raporları oluştur
    generateReports: async () => {
        const [
            totalProducts,
            lowStockProducts,
            { total: totalValue },
            categoryStats,
            movementStats
        ] = await Promise.all([
            Product.count(),
            Product.count({
                where: sequelize.literal('quantity <= "minStockLevel"')
            }),
            Product.findOne({
                attributes: [
                    [sequelize.fn('SUM', sequelize.literal('price * quantity')), 'total']
                ],
                raw: true
            }),
            Product.findAll({
                attributes: [
                    'categoryId',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.literal('price * quantity')), 'value']
                ],
                group: ['categoryId']
            }),
            StockMovement.findAll({
                attributes: [
                    'type',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('quantity')), 'total']
                ],
                group: ['type']
            })
        ]);

        return {
            summary: {
                totalProducts,
                lowStockProducts,
                totalValue: parseFloat(totalValue || 0)
            },
            categoryStats,
            movementStats
        };
    },

    // Stok tahminleri
    predictStockNeeds: async () => {
        const movements = await StockMovement.findAll({
            include: [{
                model: Product,
                as: 'Product',
                attributes: ['id', 'name', 'quantity', 'minStockLevel']
            }],
            order: [['createdAt', 'DESC']],
            limit: 100
        });

        // Basit bir tahmin algoritması
        const predictions = {};
        movements.forEach(movement => {
            const productId = movement.Product.id;
            if (!predictions[productId]) {
                predictions[productId] = {
                    product: movement.Product.name,
                    currentStock: movement.Product.quantity,
                    minLevel: movement.Product.minStockLevel,
                    predictedNeed: 0
                };
            }

            if (movement.type === 'OUT') {
                predictions[productId].predictedNeed += movement.quantity;
            }
        });

        return Object.values(predictions);
    }
};

module.exports = analyticsService; 