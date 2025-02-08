'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Mevcut ürünleri ve boş lokasyonları al
    const products = await queryInterface.sequelize.query(
      'SELECT id FROM "Products";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const locations = await queryInterface.sequelize.query(
      'SELECT id FROM "Locations" WHERE "isOccupied" = false ORDER BY "id";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Her ürün için rastgele boş bir lokasyon seç
    const updates = [];
    for (const product of products) {
      if (locations.length > 0) {
        const randomIndex = Math.floor(Math.random() * locations.length);
        const location = locations.splice(randomIndex, 1)[0];

        updates.push(
          queryInterface.sequelize.query(
            `UPDATE "Products" SET "locationId" = ${location.id} WHERE id = ${product.id};`
          ),
          queryInterface.sequelize.query(
            `UPDATE "Locations" SET "isOccupied" = true, "productId" = ${product.id} WHERE id = ${location.id};`
          )
        );
      }
    }

    await Promise.all(updates);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'UPDATE "Products" SET "locationId" = NULL;'
    );
    await queryInterface.sequelize.query(
      'UPDATE "Locations" SET "isOccupied" = false, "productId" = NULL;'
    );
  }
}; 