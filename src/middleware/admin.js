const { User, Role } = require('../models');

const admin = async (req, res, next) => {
    try {
        // Kullanıcı ve rolünü getir
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: Role,
                as: 'Role'
            }]
        });

        // Admin rolü kontrolü
        if (user.Role.name !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için admin yetkisi gerekiyor'
            });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Yetkilendirme hatası'
        });
    }
};

module.exports = admin; 