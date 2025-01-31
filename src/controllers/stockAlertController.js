const Product = require('../models/product');
const { Op } = require('sequelize');
const { Category } = require('../models');
const sequelize = require('../config/database');

const stockAlertController = {
    getCriticalStock: async (req, res) => {
        try {
            // Ürünleri, quantity'si minStockLevel'dan düşük olanları getir
            const criticalProducts = await Product.findAll({
                where: {
                    quantity: {
                        [Op.lt]: sequelize.col('minStockLevel')  // quantity < minStockLevel
                    }
                },
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['name']
                }],
                order: [
                    ['quantity', 'ASC']  // En düşük stoklu ürünleri başa al
                ]
            });

            // Debug için
            console.log('Kritik stok kontrolü:', {
                totalProducts: await Product.count(),
                criticalCount: criticalProducts.length,
                criticalProducts: criticalProducts.map(p => ({
                    name: p.name,
                    quantity: p.quantity,
                    minStockLevel: p.minStockLevel
                }))
            });

            res.json({
                success: true,
                data: criticalProducts
            });
        } catch (error) {
            console.error('Kritik stok kontrolü hatası:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Minimum stok seviyesini güncelle
    updateMinStockLevel: async (req, res) => {
        try {
            const { productId } = req.params;
            const { minStockLevel } = req.body;

            const product = await Product.findByPk(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Ürün bulunamadı'
                });
            }

            await product.update({ minStockLevel });

            res.json({
                success: true,
                message: 'Minimum stok seviyesi güncellendi',
                data: product
            });
        } catch (error) {
            console.error('Minimum stok seviyesi güncelleme hatası:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Tüm stok alarmlarını getir
    getStockAlerts: async (req, res) => {
        try {
            const alerts = await Product.findAll({
                where: {
                    [Op.or]: [
                        {
                            quantity: {
                                [Op.lt]: sequelize.col('minStockLevel')
                            }
                        },
                        {
                            quantity: {
                                [Op.lt]: 10  // Genel kritik seviye
                            }
                        }
                    ]
                },
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['name']
                }],
                order: [
                    ['quantity', 'ASC']
                ]
            });

            res.json({
                success: true,
                data: alerts
            });
        } catch (error) {
            console.error('Stok alarmları getirme hatası:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = stockAlertController;