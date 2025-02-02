const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Role = require('../models/role');
const emailService = require('../services/emailService');

// Register
exports.register = async (req, res) => {
    try {
        const { username, email, password, roleId } = req.body;

        // Email kontrolü
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Bu email adresi zaten kullanımda'
            });
        }

        // Kullanıcıyı oluştur
        const user = await User.create({
            username,
            email,
            password,
            roleId
        });

        // Role bilgisini al
        const role = await Role.findByPk(roleId);

        // Token oluştur
        const token = jwt.sign(
            { id: user.id, role: role.name },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: role.name
                },
                token
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Email kontrolü
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz email veya şifre'
            });
        }

        // Şifre kontrolü
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz email veya şifre'
            });
        }

        // Token oluştur
        const token = jwt.sign(
            { id: user.id, role: user.roleId },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Token'ı doğru formatta döndürelim
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    roleId: user.roleId
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
};

exports.forgotPassword = async (req, res) => {
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
};

module.exports = exports;