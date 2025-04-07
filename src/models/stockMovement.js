const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StockMovement extends Model {
    static associate(models) {
      StockMovement.belongsTo(models.Product, { 
        foreignKey: 'productId',
        as: 'Product'
      });
      StockMovement.belongsTo(models.User, { 
        foreignKey: 'createdBy',
        as: 'Creator'
      });
      StockMovement.belongsTo(models.Location, {
        foreignKey: 'locationId',
        as: 'Location'
      });
    }
  }

  StockMovement.init({
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Locations',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('IN', 'OUT'),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING
    },
    previousStock: {
      type: DataTypes.INTEGER
    },
    newStock: {
      type: DataTypes.INTEGER
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    movementDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    plannedExitDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'StockMovement',
    tableName: 'StockMovements'
  });

  return StockMovement;
};