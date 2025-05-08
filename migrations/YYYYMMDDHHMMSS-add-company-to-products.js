'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('Products', 'company', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      });
    } catch (error) {
      console.log('Column may already exist, continuing...');
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('Products', 'company');
    } catch (error) {
      console.log('Column may not exist, continuing...');
    }
  }
}; 