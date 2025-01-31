const cron = require('node-cron');
const Product = require('../models/product');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

// Her gün saat 09:00'da çalışacak
cron.schedule('0 9 * * *', async () => {
    try {
        // Kritik stok seviyesindeki ürünleri bul
        const criticalProducts = await Product.findAll({
            where: sequelize.literal('quantity <= minStockLevel')
        });

        // Günlük rapor verilerini hazırla
        const allProducts = await Product.findAll();
        const report = {
            totalProducts: allProducts.length,
            criticalStock: criticalProducts.length,
            totalValue: allProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0),
            criticalItems: criticalProducts
        };

        // Günlük raporu gönder
        await emailService.sendDailyReport(report);

        // Kritik ürünler için ayrı uyarılar gönder
        for (const product of criticalProducts) {
            await emailService.sendLowStockAlert(product);
        }

        logger.info('Stock alert job completed', {
            criticalProducts: criticalProducts.length
        });
    } catch (error) {
        logger.error('Stock alert job failed', {
            error: error.message
        });
    }
}); 