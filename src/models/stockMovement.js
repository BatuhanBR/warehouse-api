const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StockMovement extends Model {
    static associate(models) {
      StockMovement.belongsTo(models.Product, { foreignKey: 'productId' });
      StockMovement.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    }
  }

  StockMovement.init({
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
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
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'StockMovement',
    tableName: 'StockMovements'
  });

  return StockMovement;
};