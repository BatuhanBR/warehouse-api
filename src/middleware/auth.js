const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.protect = async (req, res, next) => {
    try {
        // Token'ı header'dan al
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Lütfen giriş yapın' });
        }

        // Token'ı doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Kullanıcıyı bul
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Kullanıcıyı request'e ekle
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Yetkilendirme hatası' });
    }
};

// Admin kontrolü
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Bu işlem için yetkiniz yok' 
            });
        }
        next();
    };
};