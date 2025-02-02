const cron = require('node-cron');
const { Product } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const logger = require('../config/logger');
const { Sequelize } = require('sequelize');

// Her gün saat 09:00'da çalışacak
cron.schedule('0 9 * * *', async () => {
    try {
        logger.info('Stok kontrol job\'ı başladı');
        
        const lowStockProducts = await Product.findAll({
            where: {
                quantity: {
                    [Op.lt]: Sequelize.col('minStockLevel')
                }
            }
        });

        if (lowStockProducts.length > 0) {
            // Email gönder
            await emailService.sendStockAlert(lowStockProducts);
            logger.info(`${lowStockProducts.length} ürün için stok uyarısı gönderildi`);
        }

        logger.info('Stok kontrol job\'ı tamamlandı');
    } catch (error) {
        logger.error('Stok kontrol job hatası:', error);
    }
}); 