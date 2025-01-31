const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockMovement = sequelize.define('StockMovement', {
    type: {
        type: DataTypes.ENUM('IN', 'OUT'),
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING
    },
    note: {
        type: DataTypes.TEXT
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'StockMovements',
    timestamps: true
});

module.exports = StockMovement;