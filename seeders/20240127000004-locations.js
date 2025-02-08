'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const locations = [];
    
    // Her raf için standart boyutlar
    const standardRackSizes = {
      small: { width: 80, height: 180, depth: 40 },
      medium: { width: 100, height: 200, depth: 60 },
      large: { width: 120, height: 220, depth: 80 }
    };
    
    // 10 raf, her rafta 4 kat, her katta 4 bölme
    for (let rack = 1; rack <= 10; rack++) {
      for (let level = 1; level <= 4; level++) {
        for (let pos = 1; pos <= 4; pos++) {
          // Raf boyutunu rastgele seç
          const size = Object.values(standardRackSizes)[Math.floor(Math.random() * 3)];
          
          locations.push({
            code: `R${rack.toString().padStart(2, '0')}-${level}-${pos}`,
            rackNumber: rack,
            level: level,
            position: pos,
            width: size.width,
            height: size.height,
            depth: size.depth,
            dimensions: JSON.stringify(size),
            isOccupied: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    await queryInterface.bulkInsert('Locations', locations, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Locations', null, {});
  }
}; 