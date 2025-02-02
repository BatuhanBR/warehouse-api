const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Email transporter oluştur
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const emailService = {
    // Düşük stok uyarısı
    sendLowStockAlert: async (product) => {
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: process.env.ALERT_EMAIL,
                subject: `Düşük Stok Uyarısı: ${product.name}`,
                html: `
                    <h2>Düşük Stok Uyarısı</h2>
                    <p>Ürün: ${product.name}</p>
                    <p>SKU: ${product.sku}</p>
                    <p>Mevcut Stok: ${product.quantity}</p>
                    <p>Minimum Stok: ${product.minStockLevel}</p>
                `
            });

            logger.info('Low stock alert sent', {
                productId: product.id,
                productName: product.name,
                quantity: product.quantity
            });
        } catch (error) {
            logger.error('Email sending failed', {
                error: error.message,
                productId: product.id
            });
        }
    },

    // Günlük rapor
    sendDailyReport: async (report) => {
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: process.env.REPORT_EMAIL,
                subject: `Günlük Stok Raporu - ${new Date().toLocaleDateString()}`,
                html: `
                    <h2>Günlük Stok Raporu</h2>
                    <h3>Özet</h3>
                    <ul>
                        <li>Toplam Ürün: ${report.totalProducts}</li>
                        <li>Kritik Stok: ${report.criticalStock}</li>
                        <li>Toplam Değer: ${report.totalValue} TL</li>
                    </ul>
                    <h3>Kritik Stok Ürünleri</h3>
                    <table border="1">
                        <tr>
                            <th>Ürün</th>
                            <th>SKU</th>
                            <th>Stok</th>
                            <th>Min. Stok</th>
                        </tr>
                        ${report.criticalItems.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.sku}</td>
                                <td>${item.quantity}</td>
                                <td>${item.minStockLevel}</td>
                            </tr>
                        `).join('')}
                    </table>
                `
            });

            logger.info('Daily report sent', {
                totalProducts: report.totalProducts,
                criticalStock: report.criticalStock
            });
        } catch (error) {
            logger.error('Daily report sending failed', {
                error: error.message
            });
        }
    },

    // Test email'i gönder (sadece geliştirme aşamasında kullanılacak)
    sendTestEmail: async () => {
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: process.env.ALERT_EMAIL,
                subject: 'Test Email',
                html: `
                    <h2>Email Sistemi Test Mesajı</h2>
                    <p>Bu bir test emailidir.</p>
                    <p>Gönderilme zamanı: ${new Date().toLocaleString()}</p>
                `
            });

            logger.info('Test email sent successfully');
            return true;
        } catch (error) {
            logger.error('Test email failed', {
                error: error.message
            });
            throw error;
        }
    },

    sendStockAlert: async (products) => {
        try {
            const mailOptions = {
                from: process.env.SMTP_FROM,
                to: process.env.ALERT_EMAIL,
                subject: 'Düşük Stok Uyarısı',
                html: `
                    <h2>Düşük Stok Seviyesindeki Ürünler</h2>
                    <table>
                        <tr>
                            <th>Ürün</th>
                            <th>SKU</th>
                            <th>Mevcut Stok</th>
                            <th>Minimum Stok</th>
                        </tr>
                        ${products.map(p => `
                            <tr>
                                <td>${p.name}</td>
                                <td>${p.sku}</td>
                                <td>${p.quantity}</td>
                                <td>${p.minStockLevel}</td>
                            </tr>
                        `).join('')}
                    </table>
                `
            };

            await transporter.sendMail(mailOptions);
            logger.info('Stok uyarı e-postası gönderildi');
        } catch (error) {
            logger.error('Email gönderme hatası:', error);
            throw error;
        }
    }
};

module.exports = emailService; 