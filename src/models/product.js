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
        unique: true,
        allowNull: false
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
        allowNull: false,
        defaultValue: 10
    },
    categoryId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Categories',
            key: 'id'
        }
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
    },
    locationId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Locations',
            key: 'id'
        }
    },
    position3D: {
        type: DataTypes.JSONB,
        defaultValue: {
            x: 0,
            y: 0,
            z: 0
        }
    }
});

// İlişkileri doğru şekilde tanımlayalım
Product.associate = (models) => {
    Product.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category'
    });

    Product.belongsTo(models.Location, {
        foreignKey: 'locationId',
        as: 'location'
    });

    Product.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
    });

    Product.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updater'
    });

    Product.hasMany(models.StockMovement, {
        foreignKey: 'productId',
        as: 'stockMovements'
    });
};

module.exports = Product;