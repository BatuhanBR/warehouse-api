'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Önce eski constraint'i kaldırmaya çalış (varsa)
      try {
        await queryInterface.removeConstraint('Locations', 'locations_productId_fkey');
      } catch (error) {
        console.log('Eski constraint bulunamadı, devam ediliyor...');
      }

      // Yeni constraint'i ekle
      await queryInterface.addConstraint('Locations', {
        fields: ['productId'],
        type: 'foreign key',
        name: 'locations_productId_fkey',
        references: {
          table: 'Products',
          field: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    } catch (error) {
      console.error('Migration hatası:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('Locations', 'locations_productId_fkey');
    } catch (error) {
      console.log('Constraint kaldırılamadı:', error);
      // Hata olsa bile devam et
    }
  }
}; 