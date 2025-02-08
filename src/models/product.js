'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'Category'
      });
      Product.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
      Product.belongsTo(models.Location, {
        foreignKey: 'locationId',
        as: 'Location'
      });
    }
  }
  
  Product.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    sku: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Mevcut stok adedi'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    minStockLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Minimum stok seviyesi'
    },
    maxStockLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Raf kapasitesine göre maksimum stok'
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    locationId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Locations',
        key: 'id'
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    dailyStorageRate: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      comment: 'Günlük depolama ücreti (TL)'
    },
    storageStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Depolama başlangıç tarihi'
    },
    expectedStorageDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Beklenen depolama süresi (gün)'
    },
    totalStorageCost: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.storageStartDate || !this.dailyStorageRate) return 0;
        
        const today = new Date();
        const startDate = new Date(this.storageStartDate);
        const days = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
        
        let discount = 1.0;
        if (days > 180) discount = 0.85;      // 6+ ay: %15 indirim
        else if (days > 90) discount = 0.90;  // 3+ ay: %10 indirim
        else if (days > 30) discount = 0.95;  // 1+ ay: %5 indirim
        
        return parseFloat((this.dailyStorageRate * days * discount).toFixed(2));
      }
    },
    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Ürün genişliği (cm)'
    },
    height: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Ürün yüksekliği (cm)'
    },
    length: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Ürün uzunluğu (cm)'
    },
    volumePerUnit: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this.width * this.height * this.length) / 1000000; // m³ cinsinden
      }
    },
    totalVolume: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.volumePerUnit * this.quantity;
      }
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'Products',
    timestamps: true,
    createdAt: true,
    updatedAt: true
  });
  
  return Product;
};