const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Shelf extends Model {
    static associate(models) {
      Shelf.hasMany(models.Cell, {
        foreignKey: 'shelfId',
        as: 'cells'
      });
    }
  }

  Shelf.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    totalCells: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 16 // Her rafta 16 hücre
    }
  }, {
    sequelize,
    modelName: 'Shelf',
    tableName: 'Shelves'
  });

  return Shelf;
}; 