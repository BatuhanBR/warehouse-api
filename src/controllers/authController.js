const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Role = require('../models/role');

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

        // Kullanıcıyı bul
        const user = await User.findOne({
            where: { email },
            include: [{
                model: Role,
                as: 'userRole',
                attributes: ['name', 'permissions']
            }]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz email veya şifre'
            });
        }

        // Şifreyi kontrol et
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz email veya şifre'
            });
        }

        // Token oluştur
        const token = jwt.sign(
            { 
                id: user.id, 
                role: user.userRole.name,
                permissions: user.userRole.permissions 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.userRole.name
                },
                token
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

module.exports = exports;