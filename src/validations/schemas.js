const Joi = require('joi');

const schemas = {
    // Ürün şemaları
    product: {
        create: Joi.object({
            name: Joi.string().min(3).max(100).required()
                .messages({
                    'string.empty': 'Ürün adı boş olamaz',
                    'string.min': 'Ürün adı en az 3 karakter olmalıdır',
                    'string.max': 'Ürün adı en fazla 100 karakter olabilir'
                }),
            sku: Joi.string().pattern(/^\d{5}$/).required()
                .messages({
                    'string.pattern.base': 'SKU 5 rakamdan oluşmalıdır (Örnek: 12345)'
                }),
            price: Joi.number().min(0).required()
                .messages({
                    'number.min': 'Fiyat 0\'dan küçük olamaz'
                }),
            quantity: Joi.number().integer().min(0)
                .messages({
                    'number.min': 'Miktar 0\'dan küçük olamaz'
                }),
            description: Joi.string().max(500),
            categoryId: Joi.number().integer().required()
                .messages({
                    'number.base': 'Geçerli bir kategori seçiniz'
                }),
            minStockLevel: Joi.number().integer().min(0)
                .messages({
                    'number.min': 'Minimum stok seviyesi 0\'dan küçük olamaz'
                })
        }),
        update: Joi.object({
            name: Joi.string().min(3).max(100),
            price: Joi.number().min(0),
            quantity: Joi.number().integer().min(0),
            description: Joi.string().max(500),
            categoryId: Joi.number().integer(),
            minStockLevel: Joi.number().integer().min(0)
        })
    },

    // Stok hareket şemaları
    stockMovement: {
        create: Joi.object({
            productId: Joi.number().integer().required(),
            type: Joi.string().valid('IN', 'OUT').required()
                .messages({
                    'any.only': 'Hareket tipi IN veya OUT olmalıdır'
                }),
            quantity: Joi.number().integer().min(1).required()
                .messages({
                    'number.min': 'Miktar en az 1 olmalıdır'
                }),
            description: Joi.string().max(200)
        })
    },

    // Lokasyon şemaları
    location: {
        create: Joi.object({
            code: Joi.string().required().pattern(/^[A-Z][0-9]-[0-9]-[0-9]$/)
                .messages({
                    'string.pattern.base': 'Lokasyon kodu formatı hatalı (Örnek: A1-1-1)'
                }),
            section: Joi.string().required(),
            row: Joi.number().integer().min(1).required(),
            level: Joi.number().integer().min(1).required(),
            position: Joi.number().integer().min(1).required(),
            capacity: Joi.number().integer().min(0).required()
        }),
        assignProduct: Joi.object({
            productId: Joi.number().integer().required()
                .messages({
                    'number.base': 'Geçerli bir ürün seçiniz'
                }),
            locationId: Joi.number().integer().required()
                .messages({
                    'number.base': 'Geçerli bir lokasyon seçiniz'
                }),
            position3D: Joi.object({
                x: Joi.number().required(),
                y: Joi.number().required(),
                z: Joi.number().required()
            }).required()
                .messages({
                    'object.base': 'Geçerli bir 3D pozisyon giriniz'
                })
        })
    },

    // Kullanıcı şemaları
    user: {
        register: Joi.object({
            username: Joi.string().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required()
                .messages({
                    'string.min': 'Şifre en az 6 karakter olmalıdır'
                }),
            roleId: Joi.number().integer().required()
        }),
        login: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
        }),
        forgotPassword: Joi.object({
            email: Joi.string().email().required()
        })
    }
};

module.exports = schemas; 