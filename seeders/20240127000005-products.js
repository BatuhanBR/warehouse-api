'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const products = [];
    const categories = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Categories";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const locations = await queryInterface.sequelize.query(
      'SELECT id FROM "Locations";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Kategori bazlı ürün isimleri
    const productNames = {
      'Elektronik': ['Laptop', 'Akıllı Telefon', 'Tablet', 'Kulaklık', 'Powerbank'],
      'Giyim': ['T-Shirt', 'Kot Pantolon', 'Sweatshirt', 'Ceket', 'Ayakkabı'],
      'Ev & Yaşam': ['Yatak Örtüsü', 'Masa Lambası', 'Perde', 'Halı', 'Yastık'],
      'Spor': ['Koşu Ayakkabısı', 'Spor Çantası', 'Yoga Matı', 'Dambıl Set', 'Basketbol Topu'],
      'Kitap': ['Roman', 'Bilim Kurgu', 'Kişisel Gelişim', 'Tarih', 'Çocuk Kitabı'],
      'Kozmetik': ['Parfüm', 'Ruj', 'Fondöten', 'Şampuan', 'Krem'],
      'Oyuncak': ['Lego Set', 'Oyuncak Araba', 'Puzzle', 'Peluş Oyuncak', 'Kutu Oyunu'],
      'Ofis': ['Kalem Set', 'Dosya Dolabı', 'Ajanda', 'Mouse Pad', 'Hesap Makinesi'],
      'Gıda': ['Kahve', 'Çay', 'Kuruyemiş', 'Çikolata', 'Baharat Set'],
      'Bahçe': ['Saksı', 'Bahçe Aletleri', 'Çiçek Tohumu', 'Sulama Sistemi', 'Bahçe Mobilyası']
    };

    // Her kategori için ürünleri oluştur
    categories.forEach(category => {
      const names = productNames[category.name] || [`Ürün ${category.id}`];
      names.forEach((name, index) => {
        const sku = `${category.id.toString().padStart(2, '0')}${(index + 1).toString().padStart(3, '0')}`;
        products.push({
          name: name,
          sku: sku,
          price: Math.floor(Math.random() * 1000) + 10,
          quantity: Math.floor(Math.random() * 100) + 1,
          minStockLevel: Math.floor(Math.random() * 20) + 5,
          categoryId: category.id,
          locationId: locations[Math.floor(Math.random() * locations.length)].id,
          position3D: JSON.stringify({ x: Math.random(), y: Math.random(), z: Math.random() }),
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    });

    await queryInterface.bulkInsert('Products', products);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Products', null, {});
  }
}; 