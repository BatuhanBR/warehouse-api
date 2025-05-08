'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Önce yetkileri ekle
    await queryInterface.bulkInsert('Permissions', [
      // Kullanıcı yetkileri
      { name: 'users.view', description: 'Kullanıcıları görüntüleme', resource: 'users', action: 'view', createdAt: new Date(), updatedAt: new Date() },
      { name: 'users.create', description: 'Kullanıcı oluşturma', resource: 'users', action: 'create', createdAt: new Date(), updatedAt: new Date() },
      { name: 'users.edit', description: 'Kullanıcı düzenleme', resource: 'users', action: 'edit', createdAt: new Date(), updatedAt: new Date() },
      { name: 'users.delete', description: 'Kullanıcı silme', resource: 'users', action: 'delete', createdAt: new Date(), updatedAt: new Date() },
      
      // Ürün yetkileri
      { name: 'products.view', description: 'Ürünleri görüntüleme', resource: 'products', action: 'view', createdAt: new Date(), updatedAt: new Date() },
      { name: 'products.create', description: 'Ürün oluşturma', resource: 'products', action: 'create', createdAt: new Date(), updatedAt: new Date() },
      { name: 'products.edit', description: 'Ürün düzenleme', resource: 'products', action: 'edit', createdAt: new Date(), updatedAt: new Date() },
      { name: 'products.delete', description: 'Ürün silme', resource: 'products', action: 'delete', createdAt: new Date(), updatedAt: new Date() },
      
      // Stok yetkileri
      { name: 'stock.view', description: 'Stok hareketlerini görüntüleme', resource: 'stock', action: 'view', createdAt: new Date(), updatedAt: new Date() },
      { name: 'stock.create', description: 'Stok hareketi oluşturma', resource: 'stock', action: 'create', createdAt: new Date(), updatedAt: new Date() },
      { name: 'stock.edit', description: 'Stok hareketi düzenleme', resource: 'stock', action: 'edit', createdAt: new Date(), updatedAt: new Date() },
      
      // Lokasyon yetkileri
      { name: 'locations.view', description: 'Lokasyonları görüntüleme', resource: 'locations', action: 'view', createdAt: new Date(), updatedAt: new Date() },
      { name: 'locations.create', description: 'Lokasyon oluşturma', resource: 'locations', action: 'create', createdAt: new Date(), updatedAt: new Date() },
      { name: 'locations.edit', description: 'Lokasyon düzenleme', resource: 'locations', action: 'edit', createdAt: new Date(), updatedAt: new Date() },
      { name: 'locations.delete', description: 'Lokasyon silme', resource: 'locations', action: 'delete', createdAt: new Date(), updatedAt: new Date() }
    ]);

    // Rollere göre yetki atamaları
    const [permissions] = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Permissions";'
    );
    const [roles] = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Roles";'
    );

    // Her rol için yetki setini belirle
    const rolePermissions = {
      admin: permissions.map(p => p.name), // Admin tüm yetkilere sahip
      warehouse_manager: [ // Yönetici yetkileri
        'users.view',
        'users.create',
        'users.edit',
        'users.delete',
        'products.view',
        'products.create',
        'products.edit',
        'products.delete',
        'stock.view',
        'stock.create',
        'stock.edit',
        'locations.view',
        'locations.create',
        'locations.edit',
        'locations.delete'
      ],
      user: [ // Normal çalışan yetkileri
        'products.view',
        'products.create',
        'products.edit',
        'products.delete',
        'stock.view',
        'stock.create',
        'stock.edit',
        'locations.view'
      ]
    };

    // Her rol için yetkileri ekle
    for (const role of roles) {
      const permissionNames = rolePermissions[role.name] || [];
      const rolePerms = permissions.filter(p => permissionNames.includes(p.name));
      
      await queryInterface.bulkInsert('RolePermissions', 
        rolePerms.map(permission => ({
          roleId: role.id,
          permissionId: permission.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('RolePermissions', null, {});
    await queryInterface.bulkDelete('Permissions', null, {});
  }
}; 