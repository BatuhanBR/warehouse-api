'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Locations', [
      {
        code: 'A1-1-1',
        section: 'A',
        row: 1,
        level: 1,
        position: 1,
        capacity: 100,
        coordinates: JSON.stringify({ x: 0, y: 0, z: 0 }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'A1-1-2',
        section: 'A',
        row: 1,
        level: 1,
        position: 2,
        capacity: 100,
        coordinates: JSON.stringify({ x: 1, y: 0, z: 0 }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'A1-2-1',
        section: 'A',
        row: 2,
        level: 1,
        position: 1,
        capacity: 100,
        coordinates: JSON.stringify({ x: 0, y: 1, z: 0 }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'A1-2-2',
        section: 'A',
        row: 2,
        level: 1,
        position: 2,
        capacity: 100,
        coordinates: JSON.stringify({ x: 1, y: 1, z: 0 }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Locations', null, {});
  }
}; 