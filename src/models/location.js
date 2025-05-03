'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
    static associate(models) {
      Location.hasMany(models.Product, {
        foreignKey: 'locationId',
        as: 'products'
      });
    }
  }
  
  Location.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    address: DataTypes.STRING,
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    rackNumber: {
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
    isOccupied: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    width: {
      type: DataTypes.FLOAT,
      defaultValue: 120
    },
    height: {
      type: DataTypes.FLOAT,
      defaultValue: 100
    },
    depth: {
      type: DataTypes.FLOAT,
      defaultValue: 100
    },
  }, {
    sequelize,
    modelName: 'Location',
    tableName: 'Locations'
  });
  
  return Location;
}; 