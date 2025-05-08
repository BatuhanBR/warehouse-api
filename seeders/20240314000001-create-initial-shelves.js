'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Önce rafları oluştur
    const shelves = [];
    const cells = [];
    const now = new Date();

    // 10 raf oluştur
    for (let i = 0; i < 10; i++) {
      shelves.push({
        name: `Raf ${i + 1}`,
        position: i + 1,
        totalCells: 16,
        createdAt: now,
        updatedAt: now
      });
    }

    await queryInterface.bulkInsert('Shelves', shelves);

    // Oluşturulan rafları al
    const createdShelves = await queryInterface.sequelize.query(
      'SELECT id FROM "Shelves";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Her raf için 16 hücre oluştur
    createdShelves.forEach(shelf => {
      for (let i = 0; i < 16; i++) {
        cells.push({
          shelfId: shelf.id,
          position: i + 1,
          capacity: 4,
          availableCapacity: 4,
          createdAt: now,
          updatedAt: now
        });
      }
    });

    await queryInterface.bulkInsert('Cells', cells);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Cells', null, {});
    await queryInterface.bulkDelete('Shelves', null, {});
  }
}; 