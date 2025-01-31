const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
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
        type: DataTypes.DECIMAL(10, 2)
    },
    location: {
        type: DataTypes.STRING
    },
    minStockLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    isStockCritical: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.quantity <= this.minStockLevel;
        }
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

// İlişkileri doğru şekilde tanımlayalım
Product.associate = (models) => {
    // Ürünü oluşturan kullanıcı ilişkisi
    Product.belongsTo(models.User, {
        foreignKey: {
            name: 'createdBy',
            allowNull: true // Geçiş için geçici olarak true
        },
        as: 'creator',
        onDelete: 'SET NULL'
    });
    
    // Ürünü güncelleyen kullanıcı ilişkisi
    Product.belongsTo(models.User, {
        foreignKey: {
            name: 'updatedBy',
            allowNull: true // Geçiş için geçici olarak true
        },
        as: 'updater',
        onDelete: 'SET NULL'
    });

    Product.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category'
    });

    Product.hasMany(models.StockMovement, {
        foreignKey: 'productId',
        as: 'stockMovements'
    });
};

module.exports = Product;