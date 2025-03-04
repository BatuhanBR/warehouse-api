'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Önce tüm lokasyonları boşalt
    await queryInterface.sequelize.query(
      'UPDATE "Locations" SET "isOccupied" = false, "productId" = NULL;'
    );

    // Mevcut ürünleri al (maksimum 100 ürün)
    const products = await queryInterface.sequelize.query(
      'SELECT id FROM "Products" LIMIT 100;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Her ürün için benzersiz bir lokasyon seç (1-100 arası)
    const usedLocations = new Set();
    const updates = [];

    for (const product of products) {
      let locationId;
      do {
        locationId = Math.floor(Math.random() * 100) + 1;
      } while (usedLocations.has(locationId));

      usedLocations.add(locationId);

      updates.push(
        queryInterface.sequelize.query(
          `UPDATE "Products" SET "locationId" = ${locationId} WHERE id = ${product.id};`
        ),
        queryInterface.sequelize.query(
          `UPDATE "Locations" SET "isOccupied" = true, "productId" = ${product.id} WHERE id = ${locationId};`
        )
      );
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