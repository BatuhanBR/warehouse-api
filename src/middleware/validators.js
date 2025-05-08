const { body, param, query } = require('express-validator');

const validators = {
    // Auth validators
    loginValidator: [
        body('email').isEmail().withMessage('Geçerli bir email adresi giriniz'),
        body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır')
    ],

    // Product validators
    createProductValidator: [
        body('name').notEmpty().withMessage('Ürün adı gereklidir'),
        body('sku')
            .notEmpty().withMessage('SKU gereklidir')
            .matches(/^\d{2}-[A-Z]{5}$/).withMessage('SKU formatı "XX-YYYYY" şeklinde olmalıdır (Örnek: 12-ABCDE)'),
        body('price').isFloat({ min: 0 }).withMessage('Geçerli bir fiyat giriniz'),
        body('quantity').isInt({ min: 0 }).withMessage('Geçerli bir miktar giriniz'),
        body('categoryId').isInt().withMessage('Geçerli bir kategori seçiniz')
    ],

    // Stock movement validators
    stockMovementValidator: [
        body('productId').isInt().withMessage('Geçerli bir ürün seçiniz'),
        body('quantity').isInt({ min: 1 }).withMessage('Miktar 1 veya daha fazla olmalıdır'),
        body('type').isIn(['IN', 'OUT']).withMessage('Geçerli bir hareket tipi seçiniz')
    ],

    // Location validators
    assignProductValidator: [
        body('productId').isInt().withMessage('Geçerli bir ürün seçiniz'),
        body('locationId').isInt().withMessage('Geçerli bir lokasyon seçiniz'),
        body('position3D').isObject().withMessage('Geçerli bir pozisyon giriniz'),
        body('position3D.x').isNumeric().withMessage('Geçerli bir X koordinatı giriniz'),
        body('position3D.y').isNumeric().withMessage('Geçerli bir Y koordinatı giriniz'),
        body('position3D.z').isNumeric().withMessage('Geçerli bir Z koordinatı giriniz')
    ]
};

module.exports = validators;