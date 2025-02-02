'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Categories', [
      { name: 'Elektronik', description: 'Elektronik ürünler', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Giyim', description: 'Giyim ürünleri', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Ev & Yaşam', description: 'Ev ve yaşam ürünleri', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Spor', description: 'Spor malzemeleri', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Kitap', description: 'Kitaplar', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Kozmetik', description: 'Kozmetik ürünleri', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Oyuncak', description: 'Oyuncaklar', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Ofis', description: 'Ofis malzemeleri', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Gıda', description: 'Gıda ürünleri', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Bahçe', description: 'Bahçe ürünleri', createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Categories', null, {});
  }
}; 