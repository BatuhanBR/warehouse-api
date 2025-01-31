'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Önce index var mı diye kontrol edelim
    const tables = await queryInterface.showAllTables();
    
    if (tables.includes('Products')) {
      await queryInterface.addIndex('Products', ['categoryId'], {
        name: 'products_categoryid_index',
        unique: false
      });
      await queryInterface.addIndex('Products', ['quantity'], {
        name: 'products_quantity_index',
        unique: false
      });
    }

    if (tables.includes('StockMovements')) {
      await queryInterface.addIndex('StockMovements', ['productId'], {
        name: 'stockmovements_productid_index',
        unique: false
      });
      await queryInterface.addIndex('StockMovements', ['createdAt'], {
        name: 'stockmovements_createdat_index',
        unique: false
      });
      await queryInterface.addIndex('StockMovements', ['type'], {
        name: 'stockmovements_type_index',
        unique: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Products', 'products_categoryid_index');
    await queryInterface.removeIndex('Products', 'products_quantity_index');
    await queryInterface.removeIndex('StockMovements', 'stockmovements_productid_index');
    await queryInterface.removeIndex('StockMovements', 'stockmovements_createdat_index');
    await queryInterface.removeIndex('StockMovements', 'stockmovements_type_index');
  }
};
