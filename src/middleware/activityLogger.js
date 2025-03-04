const logger = require('../config/logger');
const { UserActivity } = require('../models');

const logActivity = (req, res, next) => {
    const start = Date.now();

    // Response gönderildikten sonra log
    res.on('finish', () => {
        const duration = Date.now() - start;
        
        // Activity log formatı
        logger.info('Activity Log', {
            method: req.method,
            path: req.originalUrl || req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.id || 'anonymous',
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
    });

    const oldJson = res.json;
    res.json = async function(data) {
        res.json = oldJson;
        
        try {
            if (req.user) {  // Eğer kullanıcı giriş yapmışsa
                let action = `${req.method} ${req.path}`;
                let description = '';

                // İşlem tipine göre açıklama oluştur
                if (req.path.includes('/users')) {
                    if (req.method === 'POST') description = 'Yeni kullanıcı oluşturuldu';
                    if (req.method === 'PUT') description = 'Kullanıcı güncellendi';
                    if (req.method === 'DELETE') description = 'Kullanıcı silindi';
                }

                await UserActivity.create({
                    userId: req.user.id,
                    action,
                    description,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent')
                });
            }
        } catch (error) {
            console.error('Activity log error:', error);
        }

        return res.json(data);
    };

    next();
};

module.exports = logActivity; 