const Product = require('../models/product');
const { Op, literal, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

class StockAlertService {
    async checkCriticalStock() {
        try {
            const criticalProducts = await Product.findAll({
                where: sequelize.literal('quantity <= "minStockLevel"')
            });

            return criticalProducts;
        } catch (error) {
            console.error('Critical stock check error:', error);
            throw error;
        }
    }

    async getStockAlerts() {
        try {
            const products = await Product.findAll({
                attributes: [
                    'id', 'name', 'sku', 'quantity', 'minStockLevel',
                    [
                        sequelize.literal('CASE WHEN quantity <= "minStockLevel" THEN true ELSE false END'),
                        'isStockCritical'
                    ]
                ],
                where: sequelize.literal('quantity <= "minStockLevel"')
            });

            return products.map(product => ({
                id: product.id,
                name: product.name,
                sku: product.sku,
                currentStock: product.quantity,
                minStockLevel: product.minStockLevel,
                deficit: product.minStockLevel - product.quantity
            }));
        } catch (error) {
            console.error('Stock alerts error:', error);
            throw error;
        }
    }
}

module.exports = new StockAlertService();
