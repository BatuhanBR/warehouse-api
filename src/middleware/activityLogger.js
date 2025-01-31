const logger = require('../config/logger');

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

    next();
};

module.exports = logActivity; 