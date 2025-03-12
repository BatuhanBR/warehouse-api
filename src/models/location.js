'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
    static associate(models) {
      Location.hasOne(models.Product, {
        foreignKey: 'locationId',
        as: 'Product'
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
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    width: {
      type: DataTypes.FLOAT,
      defaultValue: 100
    },
    height: {
      type: DataTypes.FLOAT,
      defaultValue: 100
    },
    depth: {
      type: DataTypes.FLOAT,
      defaultValue: 100
    },
    totalCapacity: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this.width * this.height * this.depth) / 1000000; // m³ cinsinden
      }
    },
    usedCapacity: {
      type: DataTypes.VIRTUAL,
      get() {
        // Eğer bir ürün varsa ve isOccupied true ise kapasite dolu sayılır
        return this.isOccupied ? this.totalCapacity : 0;
      }
    },
    availableCapacity: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.totalCapacity - this.usedCapacity;
      }
    }
  }, {
    sequelize,
    modelName: 'Location',
    tableName: 'Locations'
  });
  
  return Location;
}; 