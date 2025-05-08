const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const { Product } = require('../models');
const { protect } = require('../middleware/authMiddleware');
const { sequelize } = require('../models');

// Test email gönder
router.post('/email/test', protect, async (req, res) => {
    try {
        await emailService.sendTestEmail();
        res.json({ success: true, message: 'Test email gönderildi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Düşük stok uyarısını test et
router.post('/email/low-stock', protect, async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { id: req.body.productId }
        });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
        }

        await emailService.sendLowStockAlert(product);
        res.json({ success: true, message: 'Düşük stok uyarısı gönderildi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Günlük raporu test et
router.post('/email/daily-report', protect, async (req, res) => {
    try {
        const criticalProducts = await Product.findAll({
            where: sequelize.literal('quantity <= "minStockLevel"')
        });

        const allProducts = await Product.findAll();
        const report = {
            totalProducts: allProducts.length,
            criticalStock: criticalProducts.length,
            totalValue: allProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0),
            criticalItems: criticalProducts
        };

        await emailService.sendDailyReport(report);
        res.json({ success: true, message: 'Günlük rapor gönderildi' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router; 