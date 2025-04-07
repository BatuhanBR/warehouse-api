'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Expenses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      expenseAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      expenseType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      expenseDescription: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      expenseStartTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      expenseEndTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Expenses');
  }
}; 