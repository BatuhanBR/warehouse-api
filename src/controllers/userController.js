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
                attributes: { 
                    exclude: ['password'],
                    include: ['lastLoginAt', 'isActive', 'email', 'username', 'id', 'createdAt', 'updatedAt']
                },
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
                let field = 'Bilinmeyen alan';
                // PostgreSQL hatasındaki constraint adını kontrol et (email için genellikle Users_email_key gibi olur)
                if (error.parent?.constraint?.includes('email')) { 
                    field = 'email adresi';
                } else if (error.parent?.constraint?.includes('username')) { 
                    field = 'kullanıcı adı';
                } else if (error.parent?.constraint?.includes('_pkey')) { // Constraint adı _pkey ile bitiyorsa ID'dir
                    // ID çakışması durumunda daha genel bir hata verelim veya loglayalım
                    console.error("Birincil anahtar (ID) çakışması tespit edildi:", error);
                    return res.status(500).json({
                         success: false,
                         // Frontend'e çok teknik detay vermeyelim
                         message: 'Kullanıcı oluşturulurken beklenmedik bir veritabanı hatası oluştu. Lütfen tekrar deneyin veya yöneticiye başvurun.' 
                    });
                }
                // Diğer unique constraint hataları için
                return res.status(400).json({
                    success: false,
                    message: `Bu ${field} zaten kullanımda.`
                });
            }

            // Diğer tüm hatalar için
            res.status(500).json({
                success: false,
                message: 'Kullanıcı oluşturulurken bir sunucu hatası oluştu.'
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

    // Mevcut (giriş yapmış) kullanıcı bilgilerini getir
    getCurrentUser: async (req, res) => {
        try {
            const userId = req.user.id; // authMiddleware tarafından eklenen kullanıcı ID'si

            const user = await User.findByPk(userId, {
                attributes: {
                    exclude: ['password'] // Şifreyi dışarıda bırak
                },
                include: [{
                    model: Role,
                    as: 'role',
                    attributes: ['name'] // Rol adını ekle
                }]
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Kullanıcı bulunamadı.'
                });
            }

            res.json({
                success: true,
                user: user // Kullanıcı bilgilerini döndür
            });

        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({
                success: false,
                message: 'Kullanıcı bilgileri alınırken bir sunucu hatası oluştu.'
            });
        }
    },

    getProfile: async (req, res) => {
        // Bu fonksiyon belki getCurrentUser ile aynı işlevi görüyordu?
        // Şimdilik yerinde bırakıyorum, ama /me rotası bunu kullanmıyor.
    },

    updateProfile: async (req, res) => {
        // ... implementation ...
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
    },

    // Profil fotoğrafı yükleme/güncelleme
    uploadProfilePicture: async (req, res) => {
        try {
            // 1. Dosya yüklendi mi kontrol et (Middleware zaten yaptı, req.file burada olmalı)
            if (!req.file) {
                // Bu durum normalde middleware tarafından yakalanmalı ama ekstra kontrol
                console.error('Controller: Profil fotoğrafı dosyası req.file içinde bulunamadı.');
                return res.status(400).json({ message: 'Profil fotoğrafı dosyası yüklenmedi veya işlenemedi.' });
            }

            // 2. Giriş yapmış kullanıcıyı bul (Auth middleware req.user'ı ekler)
            const userId = req.user.id; 
            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
            }

            // 3. Dosya yolunu oluştur (sunucu tarafı göreceli yol)
            // Örnek: /uploads/profile-pictures/user-1-1678886400000-123456789.jpg
            // NOT: Frontend bu yolu kullanırken başına API Base URL eklemeli
            const relativeFilePath = `/uploads/profile-pictures/${req.file.filename}`;

            // 4. Kullanıcının profil fotoğrafı URL'sini güncelle
            user.profilePictureUrl = relativeFilePath;
            await user.save();

            // 5. Güncellenmiş kullanıcı bilgisini döndür (şifre ve hassas olabilecek diğer alanlar hariç)
            const userWithRoleName = await User.findByPk(userId, {
                attributes: {
                    exclude: ['password'] // Şifreyi dışarıda bırak
                },
                include: [{
                    model: Role,
                    as: 'role',
                    attributes: ['name'] // Rol adını include ile al
                }]
            });

            // Yanıt için kullanıcı nesnesini manuel olarak oluştur
            const responseUser = {
                id: userWithRoleName.id,
                username: userWithRoleName.username,
                email: userWithRoleName.email,
                role: userWithRoleName.role?.name, // Role nesnesinden sadece name'i al
                profilePictureUrl: userWithRoleName.profilePictureUrl,
                isActive: userWithRoleName.isActive,
                createdAt: userWithRoleName.createdAt,
                updatedAt: userWithRoleName.updatedAt,
                lastLoginAt: userWithRoleName.lastLoginAt
                // İhtiyaç duyulan diğer güvenli alanları ekle
            };

            res.status(200).json({
                success: true,
                message: 'Profil fotoğrafı başarıyla güncellendi.',
                user: responseUser // Manuel oluşturulan nesneyi döndür
            });

        } catch (error) {
            console.error('Profil fotoğrafı yükleme controller hatası:', error);
            // Middleware zaten dosya tipi/boyut hatalarını yakalamalı,
            // bu yüzden buraya düşenler genellikle beklenmedik sunucu hatalarıdır.
            res.status(500).json({ 
                success: false,
                message: 'Profil fotoğrafı güncellenirken bir sunucu hatası oluştu.' 
            });
        }
    }
};

module.exports = userController;
