'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Locations', 'width', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 100,
      comment: 'Raf genişliği (cm)'
    });

    await queryInterface.addColumn('Locations', 'height', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 200,
      comment: 'Raf yüksekliği (cm)'
    });

    await queryInterface.addColumn('Locations', 'depth', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 60,
      comment: 'Raf derinliği (cm)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Locations', 'width');
    await queryInterface.removeColumn('Locations', 'height');
    await queryInterface.removeColumn('Locations', 'depth');
  }
}; 