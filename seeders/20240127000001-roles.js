'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Roles', [
      {
        id: 1,  // ID'leri manuel olarak belirtiyoruz
        name: 'admin',
        description: 'Sistem yöneticisi',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'user',
        description: 'Normal kullanıcı',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Roles', null, {});
  }
};