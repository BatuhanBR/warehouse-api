'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Boyut bilgileri
    await queryInterface.addColumn('Products', 'width', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Ürün genişliği (cm)'
    });

    await queryInterface.addColumn('Products', 'height', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Ürün yüksekliği (cm)'
    });

    await queryInterface.addColumn('Products', 'length', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Ürün uzunluğu (cm)'
    });

    // Depolama bilgileri
    await queryInterface.addColumn('Products', 'maxStockLevel', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'Raf kapasitesine göre maksimum stok'
    });

    await queryInterface.addColumn('Products', 'dailyStorageRate', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0.00,
      comment: 'Günlük depolama ücreti (TL)'
    });

    await queryInterface.addColumn('Products', 'storageStartDate', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Depolama başlangıç tarihi'
    });

    await queryInterface.addColumn('Products', 'expectedStorageDuration', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Beklenen depolama süresi (gün)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Boyut bilgileri
    await queryInterface.removeColumn('Products', 'width');
    await queryInterface.removeColumn('Products', 'height');
    await queryInterface.removeColumn('Products', 'length');

    // Depolama bilgileri
    await queryInterface.removeColumn('Products', 'maxStockLevel');
    await queryInterface.removeColumn('Products', 'dailyStorageRate');
    await queryInterface.removeColumn('Products', 'storageStartDate');
    await queryInterface.removeColumn('Products', 'expectedStorageDuration');
  }
};
