const winston = require('winston');
const path = require('path');

// Log dosyaları için klasör yapısı
const logDir = 'logs';

// Custom format oluşturalım
const customFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        // Eğer message bir string ise ve HTTP log ise direkt yazdır
        if (typeof message === 'string' && message.includes('HTTP')) {
            return message;
        }

        // Diğer durumlar için JSON format
        return JSON.stringify({
            level,
            timestamp,
            message,
            ...metadata
        }, null, 2);
    })
);

const logger = winston.createLogger({
    format: customFormat,
    transports: [
        // Error logs
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            format: winston.format.combine(
                winston.format.errors({ stack: true }),
                customFormat
            )
        }),
        // Activity logs
        new winston.transports.File({
            filename: path.join(logDir, 'activity.log'),
            level: 'info',
            format: customFormat
        }),
        // Combined logs (Morgan format)
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            format: winston.format.combine(
                winston.format.uncolorize(),
                winston.format.json()
            )
        })
    ]
});

// Geliştirme ortamında console'a da log basalım
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger; 