// const { User, Role } = require('../models'); // Artık DB sorgusu yapmayacağız

const admin = (req, res, next) => {
    // <<< LOG EKLEME >>>
    console.log('--- Admin Middleware Başladı ---');
    console.log('req.user içeriği:', req.user);
    console.log('req.user.role içeriği:', req.user?.role);
    console.log('-----------------------------');
    // <<< LOG BİTTİ >>>

    // auth middleware'inin req.user'ı ve req.user.role'ü (string olarak) ayarladığı varsayılıyor
    if (!req.user || !req.user.role) {
        console.error('Admin middleware: req.user veya req.user.role bulunamadı.');
        // Bu durum genellikle auth middleware hatasıdır, 401 daha uygun olabilir
        return res.status(401).json({ 
            success: false, 
            message: 'Yetkilendirme bilgisi eksik veya hatalı.' 
        });
    }

    // Doğrudan req.user.role'ü kontrol et
    if (req.user.role !== 'admin') {
        console.log(`Admin kontrolü başarısız: req.user.role ('${req.user.role}') !== 'admin'`); // Hata durumunu logla
        return res.status(403).json({
            success: false,
            message: 'Bu işlem için admin yetkisi gerekiyor'
        });
    }

    console.log('Admin kontrolü başarılı, next() çağrılıyor.'); // Başarı durumunu logla
    // Yetki varsa devam et
    next();
};

module.exports = admin; 