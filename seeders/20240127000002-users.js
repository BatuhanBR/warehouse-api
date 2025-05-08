'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const password = '123456';
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash for 123456:', hash);

    await queryInterface.bulkInsert('Users', [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        password: hash,
        roleId: 1, // Admin
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        username: 'user1',
        email: 'user1@example.com',
        password: hash,
        roleId: 2, // Normal kullanıcı
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        username: 'user2',
        email: 'user2@example.com',
        password: hash,
        roleId: 2, // Normal kullanıcı (3 yerine 2 yaptık)
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
}; 