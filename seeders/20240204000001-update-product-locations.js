'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Önce tüm lokasyonları boşalt
      await queryInterface.sequelize.query(
        'UPDATE "Locations" SET "isOccupied" = false;'
      );

      // Mevcut lokasyonları al
      const locations = await queryInterface.sequelize.query(
        'SELECT id FROM "Locations" ORDER BY id;',
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (locations.length === 0) {
        console.log('Hiç lokasyon bulunamadı');
        return;
      }

      // Mevcut ürünleri al
      const products = await queryInterface.sequelize.query(
        'SELECT id FROM "Products" ORDER BY RANDOM() LIMIT :limit;',
        {
          replacements: { limit: Math.floor(locations.length / 2) }, // Lokasyonların yarısı kadar ürün
          type: Sequelize.QueryTypes.SELECT
        }
      );

      // Rastgele seçilen ürünlere lokasyon ata
      for (let i = 0; i < products.length; i++) {
        await queryInterface.sequelize.query(
          'UPDATE "Products" SET "locationId" = :locationId WHERE id = :productId;',
          {
            replacements: {
              locationId: locations[i].id,
              productId: products[i].id
            },
            type: Sequelize.QueryTypes.UPDATE
          }
        );

        await queryInterface.sequelize.query(
          'UPDATE "Locations" SET "isOccupied" = true WHERE id = :locationId;',
          {
            replacements: { locationId: locations[i].id },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      }

      console.log(`${products.length} ürüne lokasyon atandı`);
    } catch (error) {
      console.error('Lokasyon güncelleme hatası:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.sequelize.query(
        'UPDATE "Products" SET "locationId" = NULL;'
      );
      await queryInterface.sequelize.query(
        'UPDATE "Locations" SET "isOccupied" = false;'
      );
    } catch (error) {
      console.error('Down migration hatası:', error);
      throw error;
    }
  }
}; 