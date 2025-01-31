'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Önce CategoryId sütunundaki verileri categoryId sütununa kopyalayalım (eğer varsa)
      await queryInterface.sequelize.query(`
        UPDATE "Products" 
        SET "categoryId" = "CategoryId" 
        WHERE "categoryId" IS NULL AND "CategoryId" IS NOT NULL;
      `);

      // Sonra CategoryId sütununu kaldıralım
      await queryInterface.removeColumn('Products', 'CategoryId');

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Geri alma durumunda CategoryId sütununu geri ekleyelim
      await queryInterface.addColumn('Products', 'CategoryId', {
        type: Sequelize.INTEGER,
        allowNull: true
      });

      // Verileri geri kopyalayalım
      await queryInterface.sequelize.query(`
        UPDATE "Products" 
        SET "CategoryId" = "categoryId" 
        WHERE "categoryId" IS NOT NULL;
      `);

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
};
