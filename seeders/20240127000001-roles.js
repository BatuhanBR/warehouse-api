'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Roles', [
      {
        id: 1,
        name: 'admin',
        description: 'Sistem yöneticisi',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'warehouse_manager',
        description: 'Depo Yöneticisi',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: 'user',
        description: 'Normal kullanıcı',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Roles', null, {});
  }
};