'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Mevcut ürünleri güncelle
    return queryInterface.bulkUpdate('Products', 
      { description: 'Ürün detayları yakında eklenecek' }, // Varsayılan açıklama
      { description: null } // Sadece description'ı null olanları güncelle
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Geri alma durumunda açıklamaları null yap
    return queryInterface.bulkUpdate('Products', 
      { description: null },
      { description: 'Ürün detayları yakında eklenecek' }
    );
  }
}; 