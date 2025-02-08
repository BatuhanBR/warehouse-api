'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // position3D kolonunu kaldır
      await queryInterface.removeColumn('Products', 'position3D');

      // locationId zaten varsa bu adımı atla
      const tableInfo = await queryInterface.describeTable('Products');
      if (!tableInfo.locationId) {
        await queryInterface.addColumn('Products', 'locationId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Locations',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Geri alma durumunda position3D kolonunu geri ekle
      await queryInterface.addColumn('Products', 'position3D', {
        type: Sequelize.JSON,
        allowNull: true
      });

      // locationId kolonunu kaldır
      await queryInterface.removeColumn('Products', 'locationId');
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
}; 