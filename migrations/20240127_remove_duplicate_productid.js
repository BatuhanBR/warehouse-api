'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Önce ProductId sütunundaki verileri productId sütununa kopyalayalım (eğer varsa)
      await queryInterface.sequelize.query(`
        UPDATE "StockMovements" 
        SET "productId" = "ProductId" 
        WHERE "productId" IS NULL AND "ProductId" IS NOT NULL;
      `);

      // Sonra ProductId sütununu kaldıralım
      await queryInterface.removeColumn('StockMovements', 'ProductId');

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Geri alma durumunda ProductId sütununu geri ekleyelim
      await queryInterface.addColumn('StockMovements', 'ProductId', {
        type: Sequelize.INTEGER,
        allowNull: true
      });

      // Verileri geri kopyalayalım
      await queryInterface.sequelize.query(`
        UPDATE "StockMovements" 
        SET "ProductId" = "productId" 
        WHERE "productId" IS NOT NULL;
      `);

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
};
