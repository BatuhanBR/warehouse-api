const { User, Role, UserActivity, StockMovement, Product } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const userController = {
    // Tüm kullanıcıları getir
    getUsers: async (req, res) => {
        try {
            const { search, status } = req.query;
            const where = {};

            // Arama filtresi
            if (search) {
                where[Op.or] = [
                    { username: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } }
                ];
            }

            // Durum filtresi
            if (status && status !== 'all') {
                where.isActive = status === 'active';
            }

            const users = await User.findAll({
                where,
                include: [{
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'name']
                }],
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']]
            });

            console.log('Bulunan kullanıcılar:', users); // Debug için

            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                message: 'Kullanıcılar yüklenirken bir hata oluştu'
            });
        }
    },

    // Yeni kullanıcı oluştur
    createUser: async (req, res) => {
        try {
            const { username, email, password, roleId, isActive } = req.body;

            // ID'yi belirtmeden oluşturalım, Sequelize otomatik artıracak
            const user = await User.create({
                username,
                email,
                password, // password hook'ta hashlenecek
                roleId,
                isActive: isActive ?? true // isActive gönderilmezse true olsun
            });

            // Hassas bilgileri çıkararak yanıt verelim
            const userResponse = {
                id: user.id,
                username: user.username,
                email: user.email,
                roleId: user.roleId,
                isActive: user.isActive
            };

            res.status(201).json({
                success: true,
                message: 'Kullanıcı başarıyla oluşturuldu',
                data: userResponse
            });
        } catch (error) {
            console.error('Create user error:', error);
            
            // Spesifik hata mesajları
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: 'Bu email adresi zaten kullanımda'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Kullanıcı oluşturulurken bir hata oluştu'
            });
        }
    },

    // Kullanıcı güncelle
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { username, email, password, roleId, isActive } = req.body;

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Kullanıcı bulunamadı'
                });
            }

            const updateData = {
                username,
                email,
                roleId,
                isActive
            };

            if (password) {
                updateData.password = password;
            }

            await user.update(updateData);

            res.json({
                success: true,
                message: 'Kullanıcı başarıyla güncellendi'
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: 'Kullanıcı güncellenirken bir hata oluştu'
            });
        }
    },

    // Kullanıcı sil
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            
            const user = await User.findOne({
                where: { id },
                include: [{
                    model: Role,
                    as: 'role'
                }]
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Kullanıcı bulunamadı'
                });
            }

            // Admin kullanıcısının silinmesini engelle
            if (user.role?.name === 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin kullanıcısı silinemez'
                });
            }

            // Kullanıcıyı silmek yerine pasife çek
            await user.update({ isActive: false });

            res.json({
                success: true,
                message: 'Kullanıcı başarıyla pasife alındı'
            });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Kullanıcı işlemi sırasında bir hata oluştu'
            });
        }
    },

    // Şifre güncelleme
    resetPassword: async (req, res) => {
        try {
            const user = await User.findByPk(req.params.id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Kullanıcı bulunamadı'
                });
            }

            // Yeni şifreyi hashle
            const hashedPassword = await bcrypt.hash('123456', 10);

            await user.update({
                password: hashedPassword
            });

            res.json({
                success: true,
                message: 'Şifre başarıyla güncellendi'
            });
        } catch (error) {
            console.error('Password reset error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            const user = await User.findOne({
                where: { email },
                include: [{
                    model: Role,
                    as: 'role',
                    attributes: ['name']
                }]
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Kullanıcı bulunamadı'
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Geçersiz şifre'
                });
            }

            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email, 
                    role: user.role.name
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            await user.update({ lastLoginAt: new Date() });

            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        role: user.role.name
                    }
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    register: async (req, res) => {
        try {
            const { email, password, role } = req.body;
            
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                email,
                password: hashedPassword,
                role: role || 'user'
            });

            res.status(201).json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getProfile: async (req, res) => {
        // ... implementation
    },

    updateProfile: async (req, res) => {
        // ... implementation
    },

    // Kullanıcı aktivitelerini getir
    getUserActivities: async (req, res) => {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            
            const whereClause = {};
            
            // Tarih filtresi
            if (startDate && endDate) {
                whereClause.createdAt = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            // Kullanıcı aktiviteleri
            const userActivities = await UserActivity.findAll({
                where: { 
                    userId: id,
                    ...whereClause 
                },
                order: [['createdAt', 'DESC']],
                attributes: ['createdAt', 'action', 'description']
            });

            // Stok hareketleri - sadece bu kullanıcının yaptığı hareketler
            const stockMovements = await StockMovement.findAll({
                where: { 
                    createdBy: id,  // Kullanıcıya göre filtrele
                    ...whereClause 
                },
                order: [['createdAt', 'DESC']],
                include: [{
                    model: Product,
                    as: 'Product',
                    attributes: ['name']
                }],
                attributes: [
                    'createdAt',
                    'type',
                    'quantity',
                    'description'
                ]
            });

            // İki veri setini birleştir ve formatla
            const combinedActivities = {
                system: userActivities.map(ua => ({
                    createdAt: ua.createdAt,
                    action: ua.action,
                    description: ua.description,
                    type: 'system'
                })),
                stock: stockMovements.map(sm => ({
                    createdAt: sm.createdAt,
                    action: sm.type,
                    description: sm.description || '-',
                    type: 'stock',
                    movementType: sm.type,
                    productName: sm.Product.name,
                    quantity: sm.quantity
                }))
            };

            res.json({
                success: true,
                data: combinedActivities
            });
        } catch (error) {
            console.error('Get user activities error:', error);
            res.status(500).json({
                success: false,
                message: 'Kullanıcı aktiviteleri yüklenirken bir hata oluştu'
            });
        }
    }
};

module.exports = userController;
