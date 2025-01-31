const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    // Detaylı hata logu
    logger.error('Error occurred', {
        error: err.message,
        name: err.name,
        stack: err.stack,
        path: req.originalUrl || req.url,
        method: req.method,
        userId: req.user?.id || 'anonymous',
        body: req.body,
        params: req.params,
        query: req.query
    });

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: err.errors
        });
    }

    // Sequelize errors
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Database Validation Error',
            errors: err.errors.map(e => e.message)
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
};

module.exports = errorHandler;