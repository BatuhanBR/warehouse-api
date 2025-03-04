const { Op } = require('sequelize');
const { Product } = require('../models');
const StockMovement = require('../models/stockMovement');
const { sequelize } = require('../models');

exports.addStock = async (req, res) => {
    try {
        const { productId, quantity, description } = req.body;

        // Ürünü bul
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Ürün bulunamadı'
            });
        }

        const previousStock = product.quantity;
        const newStock = previousStock + quantity;

        // Ürün stok miktarını güncelle
        await product.update({
            quantity: newStock
        });

        // Stok hareketi kaydet
        const stockMovement = await StockMovement.create({
            type: 'IN',
            quantity,
            description,
            productId,
            previousStock,
            newStock
        });

        res.json({
            success: true,
            data: {
                product,
                stockMovement
            }
        });
    } catch (error) {
        console.error('Stock add error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.removeStock = async (req, res) => {
    try {
        const { productId, quantity, description } = req.body;

        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Ürün bulunamadı'
            });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Yetersiz stok'
            });
        }

        const previousStock = product.quantity;
        const newStock = previousStock - quantity;

        await product.update({
            quantity: newStock
        });

        const stockMovement = await StockMovement.create({
            type: 'OUT',
            quantity,
            description,
            productId,
            previousStock,
            newStock
        });

        res.json({
            success: true,
            data: {
                product,
                stockMovement
            }
        });
    } catch (error) {
        console.error('Stock remove error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getStockMovements = async (req, res) => {
    try {
        const stockMovements = await StockMovement.findAll({
            include: [{
                model: Product,
                attributes: ['name', 'sku']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: stockMovements
        });
    } catch (error) {
        console.error('Get stock movements error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getStockMovementReport = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            type,          // IN, OUT veya tümü
            productId,     // Belirli bir ürün için
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        // Filtreleme koşulları
        const whereConditions = {};

        // Tarih filtresi
        if (startDate || endDate) {
            whereConditions.createdAt = {};
            if (startDate) {
                whereConditions.createdAt[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereConditions.createdAt[Op.lte] = new Date(endDate);
            }
        }

        // Hareket tipi filtresi
        if (type && ['IN', 'OUT'].includes(type.toUpperCase())) {
            whereConditions.type = type.toUpperCase();
        }

        // Ürün filtresi
        if (productId) {
            whereConditions.productId = productId;
        }

        // Stok hareketlerini getir
        const movements = await StockMovement.findAll({
            where: whereConditions,
            include: [{
                model: Product,
                attributes: ['name', 'sku', 'price']
            }],
            order: [[sortBy, sortOrder]],
        });

        // Özet istatistikler
        const summary = {
            totalMovements: movements.length,
            inMovements: movements.filter(m => m.type === 'IN').length,
            outMovements: movements.filter(m => m.type === 'OUT').length,
            totalInQuantity: movements
                .filter(m => m.type === 'IN')
                .reduce((sum, m) => sum + m.quantity, 0),
            totalOutQuantity: movements
                .filter(m => m.type === 'OUT')
                .reduce((sum, m) => sum + m.quantity, 0),
            dateRange: {
                start: startDate || 'All time',
                end: endDate || 'All time'
            }
        };

        // Ürün bazında özet
        const productSummary = {};
        movements.forEach(movement => {
            const productId = movement.productId;
            if (!productSummary[productId]) {
                productSummary[productId] = {
                    productName: movement.Product.name,
                    sku: movement.Product.sku,
                    inQuantity: 0,
                    outQuantity: 0,
                    netChange: 0
                };
            }
            
            if (movement.type === 'IN') {
                productSummary[productId].inQuantity += movement.quantity;
                productSummary[productId].netChange += movement.quantity;
            } else {
                productSummary[productId].outQuantity += movement.quantity;
                productSummary[productId].netChange -= movement.quantity;
            }
        });

        res.json({
            success: true,
            summary,
            productSummary,
            movements
        });
    } catch (error) {
        console.error('Stock movement report error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Stok hareketi oluştur
exports.createStockMovement = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { productId, type, quantity, reason, note } = req.body;

        // Ürünü kontrol et
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Ürün bulunamadı'
            });
        }

        // Stok çıkışı için stok kontrolü
        if (type === 'OUT') {
            const currentStock = await Product.sum('quantity', {
                where: { id: productId }
            });

            if (currentStock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Yetersiz stok'
                });
            }
        }

        // Stok hareketi oluştur
        const stockMovement = await StockMovement.create({
            productId,
            type,
            quantity,
            reason,
            note,
            createdBy: req.user.id
        }, { transaction: t });

        // Ürün stok miktarını güncelle
        const updateQuantity = type === 'IN' ? quantity : -quantity;
        await Product.increment('quantity', {
            by: updateQuantity,
            where: { id: productId },
            transaction: t
        });

        await t.commit();

        res.status(201).json({
            success: true,
            data: stockMovement
        });
    } catch (error) {
        await t.rollback();
        console.error('Stock movement error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Ürün bazlı stok hareketleri
exports.getProductStockMovements = async (req, res) => {
    try {
        const { productId } = req.params;
        const { startDate, endDate } = req.query;

        const whereClause = {
            productId: productId
        };

        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const stockMovements = await StockMovement.findAll({
            where: whereClause,
            include: [{
                model: Product,
                as: 'Product',
                attributes: ['name', 'sku']
            }],
            order: [['createdAt', 'DESC']]
        });

        const summary = {
            totalIn: stockMovements
                .filter(move => move.type === 'IN')
                .reduce((sum, move) => sum + move.quantity, 0),
            totalOut: stockMovements
                .filter(move => move.type === 'OUT')
                .reduce((sum, move) => sum + move.quantity, 0)
        };

        res.json({
            success: true,
            data: {
                movements: stockMovements,
                summary: summary
            }
        });
    } catch (error) {
        console.error('Get product stock movements error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Stok hareket özeti
exports.getStockSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const whereClause = {};
        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const stockMovements = await StockMovement.findAll({
            where: whereClause,
            include: [{
                model: Product,
                as: 'Product',
                attributes: ['id', 'name', 'sku', 'quantity']
            }],
            order: [['createdAt', 'DESC']]
        });

        const productSummary = {};
        stockMovements.forEach(movement => {
            const productId = movement.Product.id;
            if (!productSummary[productId]) {
                productSummary[productId] = {
                    productName: movement.Product.name,
                    sku: movement.Product.sku,
                    currentStock: movement.Product.quantity,
                    totalIn: 0,
                    totalOut: 0
                };
            }

            if (movement.type === 'IN') {
                productSummary[productId].totalIn += movement.quantity;
            } else {
                productSummary[productId].totalOut += movement.quantity;
            }
        });

        res.json({
            success: true,
            data: {
                summary: Object.values(productSummary)
            }
        });
    } catch (error) {
        console.error('Get stock summary error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const reserveStock = async (req, res) => {
    const { productId, quantity, duration } = req.body;
    // Stok rezervasyon işlemi
};