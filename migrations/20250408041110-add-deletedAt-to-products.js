'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true, // Silinmemiş kayıtlar için NULL olmalı
      defaultValue: null
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Products', 'deletedAt');
  }
};