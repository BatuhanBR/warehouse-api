const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CellProduct extends Model {
    static associate(models) {
      CellProduct.belongsTo(models.Cell, {
        foreignKey: 'cellId',
        as: 'cell'
      });
      CellProduct.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
    }
  }

  CellProduct.init({
    cellId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    position: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { x: 0, y: 0, z: 0 } // 3D pozisyon
    }
  }, {
    sequelize,
    modelName: 'CellProduct',
    tableName: 'CellProducts'
  });

  return CellProduct;
}; 