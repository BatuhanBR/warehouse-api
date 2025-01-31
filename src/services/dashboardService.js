const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Product, StockMovement, Category } = require('../models');
const { QueryTypes } = require('sequelize');

class DashboardService {
    async getStatistics() {
        try {
            const [
                totalProducts,
                totalCategories,
                lowStockProducts,
                totalMovements,
                topMovedProducts
            ] = await Promise.all([
                Product.count(),
                Category.count(),
                Product.count({ where: sequelize.literal('"quantity" <= "minStockLevel"') }),
                StockMovement.count(),
                sequelize.query(`
                    SELECT 
                        "Product"."id" AS "id", 
                        "Product"."name" AS "name", 
                        COUNT("StockMovement"."id") AS "total_movements",
                        SUM(CASE WHEN "type" = 'IN' THEN "StockMovement"."quantity" ELSE 0 END) AS "total_in",
                        SUM(CASE WHEN "type" = 'OUT' THEN "StockMovement"."quantity" ELSE 0 END) AS "total_out"
                    FROM "StockMovements" AS "StockMovement"
                    INNER JOIN "Products" AS "Product" ON "StockMovement"."productId" = "Product"."id"
                    GROUP BY "Product"."id", "Product"."name"
                    ORDER BY COUNT("StockMovement"."id") DESC
                    LIMIT 5;
                `, {
                    type: QueryTypes.SELECT,
                })
            ]);

            return {
                totalProducts,
                totalCategories,
                lowStockProducts,
                totalMovements,
                topMovedProducts
            };
        } catch (error) {
            console.error('Dashboard stats error:', error);
            throw error;
        }
    }

    static async getTopMovedProducts() {
        const result = await sequelize.query(`
            SELECT 
                "Product"."id" AS "id", 
                "Product"."name" AS "name", 
                COUNT("StockMovement"."id") AS "total_movements",
                SUM(CASE WHEN "type" = 'IN' THEN "StockMovement"."quantity" ELSE 0 END) AS "total_in",
                SUM(CASE WHEN "type" = 'OUT' THEN "StockMovement"."quantity" ELSE 0 END) AS "total_out"
            FROM "StockMovements" AS "StockMovement"
            INNER JOIN "Products" AS "Product" ON "StockMovement"."productId" = "Product"."id"
            GROUP BY "Product"."id", "Product"."name"
            ORDER BY COUNT("StockMovement"."id") DESC
            LIMIT 5;
        `, {
            type: QueryTypes.SELECT,
        });
        return result;
    }
}

module.exports = new DashboardService();
