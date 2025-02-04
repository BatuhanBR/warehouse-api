const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Ürün adı boş olamaz'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Bu SKU kodu zaten kullanılıyor'
      },
      validate: {
        isValid(value) {
          if (!/^\d{5}$/.test(value)) {
            throw new Error('SKU 5 rakamdan oluşmalıdır (Örnek: 12345)');
          }
        }
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: {
          msg: 'Stok miktarı tam sayı olmalıdır'
        },
        min: {
          args: [0],
          msg: 'Stok miktarı negatif olamaz'
        }
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Fiyat geçerli bir sayı olmalıdır'
        },
        min: {
          args: [0],
          msg: 'Fiyat negatif olamaz'
        }
      }
    },
    minStockLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: {
          msg: 'Minimum stok seviyesi tam sayı olmalıdır'
        },
        min: {
          args: [0],
          msg: 'Minimum stok seviyesi negatif olamaz'
        }
      }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    position3D: {
      type: DataTypes.JSON,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    isStockCritical: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.quantity <= this.minStockLevel;
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

  Product.associate = (models) => {
    Product.belongsTo(models.Category, {
      foreignKey: 'categoryId'
    });
    Product.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    Product.hasMany(models.StockMovement, {
      foreignKey: 'productId'
    });
  };

  return Product;
};