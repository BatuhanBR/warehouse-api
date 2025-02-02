'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Roles', [
      { 
        id: 1,
        name: 'admin', 
        description: 'Sistem yöneticisi', 
        createdAt: new Date(), 
        updatedAt: new Date() 
      },
      { 
        id: 2,
        name: 'manager', 
        description: 'Depo yöneticisi', 
        createdAt: new Date(), 
        updatedAt: new Date() 
      },
      { 
        id: 3,
        name: 'staff', 
        description: 'Depo personeli', 
        createdAt: new Date(), 
        updatedAt: new Date() 
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Roles', null, {});
  }
};