'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const products = await queryInterface.sequelize.query(
      'SELECT id, quantity FROM "Products";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const movements = [];
    const movementTypes = ['IN', 'OUT'];
    const descriptions = [
      'Yeni stok girişi',
      'Satış',
      'İade',
      'Sayım farkı',
      'Hasar',
      'Transfer',
      'Tedarik',
      'Müşteri iadesi',
      'Fire',
      'Stok düzeltme'
    ];

    // Her ürün için 20 hareket oluştur
    products.forEach(product => {
      let currentStock = product.quantity;
      
      for(let i = 0; i < 20; i++) {
        const type = movementTypes[Math.floor(Math.random() * movementTypes.length)];
        const quantity = Math.floor(Math.random() * 20) + 1;
        const previousStock = currentStock;
        
        if(type === 'IN') {
          currentStock += quantity;
        } else {
          if(currentStock >= quantity) {
            currentStock -= quantity;
          } else {
            continue; // Stok yetersizse bu hareketi atla
          }
        }

        movements.push({
          productId: product.id,
          type,
          quantity,
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          previousStock,
          newStock: currentStock,
          createdBy: Math.floor(Math.random() * 3) + 1,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Son 30 gün
          updatedAt: new Date()
        });
      }
    });

    await queryInterface.bulkInsert('StockMovements', movements);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('StockMovements', null, {});
  }
}; 