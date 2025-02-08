const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

const authController = {
    register: async (req, res) => {
        try {
            const { username, email, password, roleId } = req.body;

            // Email kontrolü
            const existingUser = await User.findOne({ 
                where: { email } 
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu email adresi zaten kullanılıyor'
                });
            }

            // Role kontrolü
            const role = await Role.findByPk(roleId);
            if (!role) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçersiz rol'
                });
            }

            // Kullanıcıyı oluştur
            const user = await User.create({
                username,
                email,
                password,
                roleId,
                isActive: true
            });

            res.status(201).json({
                success: true,
                message: 'Kullanıcı başarıyla oluşturuldu',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    roleId: user.roleId
                }
            });

        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Kayıt işlemi sırasında bir hata oluştu'
            });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            console.log('Login attempt for:', email);
            console.log('Attempted password:', password);

            const user = await User.findOne({
                where: { email },
                include: [{
                    model: Role,
                    as: 'role'
                }]
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Kullanıcı bulunamadı'
                });
            }

            console.log('Found user password hash:', user.password);
            
            const isValidPassword = await bcrypt.compare(password, user.password);
            console.log('Password comparison result:', isValidPassword);

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

            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role.name
                    }
                }
            });

        } catch (error) {
            console.error('Login error details:', error);
            res.status(500).json({
                success: false,
                message: 'Giriş yapılırken bir hata oluştu'
            });
        }
    },

    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ where: { email } });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Bu email adresi ile kayıtlı kullanıcı bulunamadı'
                });
            }

            // Şifre sıfırlama token'ı oluştur
            const resetToken = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Gerçek email gönderimi yerine console'a yazdıralım
            console.log('Şifre sıfırlama linki:', `http://localhost:3001/reset-password?token=${resetToken}`);

            // Normalde burası email gönderecek
            // await emailService.sendPasswordResetEmail(user.email, resetToken);

            res.json({
                success: true,
                message: 'Şifre sıfırlama bağlantısı gönderildi'
            });
        } catch (error) {
            console.error('Şifre sıfırlama hatası:', error);
            res.status(500).json({
                success: false,
                message: 'Şifre sıfırlama işlemi sırasında bir hata oluştu'
            });
        }
    }
};

module.exports = authController;