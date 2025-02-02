const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
    static associate(models) {
      Location.hasMany(models.Product, { foreignKey: 'locationId' });
    }
  }

  Location.init({
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    section: {
      type: DataTypes.STRING,
      allowNull: false
    },
    row: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    occupied: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('empty', 'partial', 'full'),
      defaultValue: 'empty'
    },
    coordinates: {
      type: DataTypes.JSON
    }
  }, {
    sequelize,
    modelName: 'Location',
    tableName: 'Locations'
  });

  return Location;
}; 