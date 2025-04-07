'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('StockMovements', 'locationId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Locations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('StockMovements', 'locationId');
  }
}; 