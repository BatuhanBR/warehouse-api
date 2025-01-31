const User = require('../models/user');
const Role = require('../models/role');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Kullanıcı güncelleme
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Role'ün var olup olmadığını kontrol et
        const role = await Role.findByPk(req.body.roleId);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Belirtilen rol bulunamadı'
            });
        }

        await user.update({
            roleId: req.body.roleId
        });

        // Güncellenmiş kullanıcıyı role bilgisiyle birlikte getir
        const updatedUser = await User.findByPk(user.id, {
            include: [{
                model: Role,
                as: 'Role'
            }]
        });

        res.json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        console.error('User update error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Tüm kullanıcıları getir
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            include: [{
                model: Role,
                as: 'Role',
                attributes: ['name', 'description']
            }],
            attributes: { exclude: ['password'] }
        });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Tek kullanıcı getir
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: [{
                model: Role,
                as: 'Role',
                attributes: ['name', 'description']
            }],
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Şifre güncelleme
exports.resetPassword = async (req, res) => {
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
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
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

exports.register = async (req, res) => {
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
};

exports.getProfile = async (req, res) => {
    // ... implementation
};

exports.updateProfile = async (req, res) => {
    // ... implementation
};
