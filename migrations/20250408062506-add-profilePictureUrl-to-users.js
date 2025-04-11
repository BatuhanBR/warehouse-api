'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'profilePictureUrl', { // 'Users' tablosuna 'profilePictureUrl' sütunu ekle
      type: Sequelize.STRING, // Veri tipi STRING
      allowNull: true,        // NULL değerlere izin ver
      after: 'lastLoginAt'    // 'lastLoginAt' sütunundan sonra ekle (isteğe bağlı, sıralama için)
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'profilePictureUrl'); // Geri alma işlemi: Sütunu kaldır
  }
};