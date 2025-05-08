const { Role, Permission } = require('../models');

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

// Rol yetkilerini getir
exports.getRolePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        
        const role = await Role.findByPk(id, {
            include: [{
                model: Permission,
                as: 'permissions',
                attributes: ['name']
            }]
        });

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Rol bulunamadı'
            });
        }

        res.json({
            success: true,
            data: role.permissions
        });
    } catch (error) {
        console.error('Get role permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Rol yetkileri yüklenirken bir hata oluştu'
        });
    }
};

// Rol yetkilerini güncelle
exports.updateRolePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;

        const role = await Role.findByPk(id);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Rol bulunamadı'
            });
        }

        // Önce mevcut yetkileri bul
        const permissionRecords = await Permission.findAll({
            where: {
                name: permissions
            }
        });

        // Rol-yetki ilişkisini güncelle
        await role.setPermissions(permissionRecords);

        res.json({
            success: true,
            message: 'Rol yetkileri güncellendi'
        });
    } catch (error) {
        console.error('Update role permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Rol yetkileri güncellenirken bir hata oluştu'
        });
    }
};
