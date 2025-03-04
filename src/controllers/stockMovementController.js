const { StockMovement, Product, Location, User, Op } = require('../models');

const stockMovementController = {
    // Tüm stok hareketlerini getir
    getStockMovements: async (req, res) => {
        try {
            const { type, productId, locationId, startDate, endDate } = req.query;
            const where = {};

            if (type) where.type = type;
            if (productId) where.productId = productId;
            if (locationId) where.locationId = locationId;
            if (startDate && endDate) {
                where.createdAt = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            const movements = await StockMovement.findAll({
                where,
                include: [
                    {
                        model: Product,
                        as: 'Product',
                        attributes: ['name']
                    },
                    {
                        model: Location,
                        as: 'Location',
                        attributes: ['code']
                    },
                    {
                        model: User,
                        as: 'Creator',
                        attributes: ['username']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            res.json({
                success: true,
                data: movements
            });
        } catch (error) {
            console.error('Get stock movements error:', error);
            res.status(500).json({
                success: false,
                message: 'Stok hareketleri yüklenirken bir hata oluştu!'
            });
        }
    },

    // Yeni stok hareketi oluştur
    createStockMovement: async (req, res) => {
        try {
            const { productId, type, quantity, description } = req.body;

            // Ürünü bul
            const product = await Product.findByPk(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Ürün bulunamadı'
                });
            }

            // Önceki stok miktarını kaydet
            const previousStock = product.quantity;

            // Stok miktarını güncelle
            let newStock;
            if (type === 'IN') {
                newStock = previousStock + quantity;
            } else {
                if (previousStock < quantity) {
                    return res.status(400).json({
                        success: false,
                        message: 'Yetersiz stok'
                    });
                }
                newStock = previousStock - quantity;
            }

            // Stok hareketini kaydet
            const movement = await StockMovement.create({
                productId,
                type,
                quantity,
                description,
                previousStock,
                newStock,
                createdBy: req.user.id
            });

            // Ürün stok miktarını güncelle
            await product.update({ quantity: newStock });

            res.status(201).json({
                success: true,
                message: 'Stok hareketi başarıyla kaydedildi',
                data: movement
            });
        } catch (error) {
            console.error('Create stock movement error:', error);
            res.status(500).json({
                success: false,
                message: 'Stok hareketi kaydedilirken bir hata oluştu'
            });
        }
    },

    // Belirli bir stok hareketini getir
    getStockMovement: async (req, res) => {
        try {
            const movement = await StockMovement.findByPk(req.params.id, {
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

            if (!movement) {
                return res.status(404).json({
                    success: false,
                    message: 'Stok hareketi bulunamadı'
                });
            }

            res.json({
                success: true,
                data: movement
            });
        } catch (error) {
            console.error('Get stock movement error:', error);
            res.status(500).json({
                success: false,
                message: 'Stok hareketi alınırken bir hata oluştu'
            });
        }
    },

    // Ürüne göre stok hareketlerini getir
    getProductMovements: async (req, res) => {
        try {
            const movements = await StockMovement.findAll({
                where: {
                    productId: req.params.productId
                },
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
                order: [['createdAt', 'DESC']]
            });

            res.json({
                success: true,
                data: movements
            });
        } catch (error) {
            console.error('Get product movements error:', error);
            res.status(500).json({
                success: false,
                message: 'Ürün hareketleri alınırken bir hata oluştu'
            });
        }
    },

    // Tarih aralığına göre stok hareketlerini getir
    getMovementsByDateRange: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;

            const movements = await StockMovement.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [new Date(startDate), new Date(endDate)]
                    }
                },
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
                order: [['createdAt', 'DESC']]
            });

            res.json({
                success: true,
                data: movements
            });
        } catch (error) {
            console.error('Get movements by date range error:', error);
            res.status(500).json({
                success: false,
                message: 'Tarih aralığına göre hareketler alınırken bir hata oluştu'
            });
        }
    }
};

module.exports = stockMovementController; 