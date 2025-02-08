'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Kategori bazlı günlük depolama ücretleri
    const categoryRates = {
      'Elektronik': 100,    // Hassas ürünler
      'Gıda': 150,         // Soğuk zincir gerektirir
      'Kozmetik': 120,     // Sıcaklık kontrolü gerektirir
      'Kitap': 50,         // Normal depolama
      'Giyim': 70,         // Normal depolama
      'Spor': 80,          // Normal depolama
      'Ev & Yaşam': 90,    // Büyük ürünler
      'Oyuncak': 60,       // Normal depolama
      'Ofis': 70,          // Normal depolama
      'Bahçe': 100         // Büyük ürünler
    };

    // Önce tüm ürünleri ve kategorilerini alalım
    const products = await queryInterface.sequelize.query(
      `SELECT p.id, p.quantity, c.name as categoryName 
       FROM "Products" p 
       JOIN "Categories" c ON p."categoryId" = c.id 
       WHERE p."dailyStorageRate" IS NULL 
       OR p."storageStartDate" IS NULL 
       OR p."expectedStorageDuration" IS NULL`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Her ürün için güncelleme yapalım
    for (const product of products) {
      const rate = categoryRates[product.categoryName] || 50; // Varsayılan 50
      const storageStartDate = new Date();
      storageStartDate.setDate(storageStartDate.getDate() - Math.floor(Math.random() * 90)); // Son 90 gün içinde
      const expectedDuration = Math.floor(Math.random() * 180) + 30; // 30-210 gün arası

      await queryInterface.bulkUpdate('Products',
        {
          dailyStorageRate: rate,
          storageStartDate: storageStartDate,
          expectedStorageDuration: expectedDuration,
          updatedAt: new Date()
        },
        { id: product.id }
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Geri alma işlemi gerekirse null değerlere döndür
    await queryInterface.bulkUpdate('Products',
      {
        dailyStorageRate: null,
        storageStartDate: null,
        expectedStorageDuration: null
      },
      { dailyStorageRate: { [Sequelize.Op.ne]: null } }
    );
  }
}; 