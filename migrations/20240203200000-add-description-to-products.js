'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Eğer description kolonu yoksa ekle
    await queryInterface.describeTable('Products').then(tableDefinition => {
      if (!tableDefinition.description) {
        return queryInterface.addColumn('Products', 'description', {
          type: Sequelize.TEXT,
          allowNull: true
        });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Geri alma durumunda description kolonunu kaldır
    await queryInterface.removeColumn('Products', 'description');
  }
}; 