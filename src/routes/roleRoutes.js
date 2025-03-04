const express = require('express');
const router = express.Router();
const { Role } = require('../models');
const auth = require('../middleware/auth');
const roleController = require('../controllers/roleController');

// Tek bir GET endpoint'i olsun
router.get('/', auth, async (req, res) => {
    try {
        const roles = await Role.findAll({
            attributes: ['id', 'name', 'description']
        });
        
        console.log('Bulunan roller:', roles); // Debug için

        if (!roles) {
            throw new Error('Roller bulunamadı');
        }

        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({
            success: false,
            message: 'Roller yüklenirken bir hata oluştu'
        });
    }
});

// Rol yetkilerini getir
router.get('/:id/permissions', auth, roleController.getRolePermissions);

// Rol yetkilerini güncelle
router.put('/:id/permissions', auth, roleController.updateRolePermissions);

module.exports = router;
