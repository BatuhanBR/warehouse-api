'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Locations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      rackNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10
        }
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 4
        }
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 4
        }
      },
      dimensions: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {
          width: 0.8,
          length: 1.2,
          height: 1.5
        }
      },
      isOccupied: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: true
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
    await queryInterface.dropTable('Locations');
  }
}; 