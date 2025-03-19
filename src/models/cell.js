const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cell extends Model {
    static associate(models) {
      Cell.belongsTo(models.Shelf, {
        foreignKey: 'shelfId',
        as: 'shelf'
      });
      Cell.hasMany(models.CellProduct, {
        foreignKey: 'cellId',
        as: 'products'
      });
    }
  }

  Cell.init({
    shelfId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4 // Maksimum 4 küçük kutu kapasitesi
    },
    availableCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4 // Başlangıçta boş
    }
  }, {
    sequelize,
    modelName: 'Cell',
    tableName: 'Cells'
  });

  return Cell;
}; 