const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, { foreignKey: 'categoryId' });
      Product.belongsTo(models.Location, { foreignKey: 'locationId' });
      Product.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      Product.hasMany(models.StockMovement, { foreignKey: 'productId' });
    }
  }

  Product.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    locationCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    minStockLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isStockCritical: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.quantity <= this.minStockLevel;
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    position3D: {
      type: DataTypes.JSON
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'Products'
  });

  return Product;
};