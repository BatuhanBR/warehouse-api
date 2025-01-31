const Role = require('../models/role');

// Rol oluşturma
exports.createRole = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        const role = await Role.create({
            name,
            description
        });

        res.status(201).json({
            success: true,
            data: role
        });
    } catch (error) {
        console.error('Role creation error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Tüm rolleri getirme
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.findAll();
        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
