const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 5, // IP başına maksimum istek
    message: {
        success: false,
        message: 'Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.'
    }
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 dakika
    max: 100, // IP başına maksimum istek
    message: {
        success: false,
        message: 'Çok fazla istek yaptınız. Lütfen daha sonra tekrar deneyin.'
    }
});

module.exports = {
    authLimiter,
    apiLimiter
}; 