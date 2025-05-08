'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Önce mevcut foreign key'i kaldırmaya çalış (varsa)
    try {
      await queryInterface.removeConstraint('Users', 'Users_roleId_fkey');
    } catch (error) {
      console.log('Eski constraint bulunamadı');
    }

    // Yeni foreign key constraint'i ekle
    await queryInterface.addConstraint('Users', {
      fields: ['roleId'],
      type: 'foreign key',
      name: 'Users_roleId_fkey',
      references: {
        table: 'Roles',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Users', 'Users_roleId_fkey');
  }
}; 