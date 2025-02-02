'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Önce sequence'i resetleyelim
    await queryInterface.sequelize.query('ALTER SEQUENCE "Users_id_seq" RESTART WITH 4;');
    
    await queryInterface.bulkInsert('Users', [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        roleId: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        username: 'manager',
        email: 'manager@example.com',
        password: await bcrypt.hash('manager123', 10),
        roleId: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        username: 'staff',
        email: 'staff@example.com',
        password: await bcrypt.hash('staff123', 10),
        roleId: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
}; 