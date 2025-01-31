const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Location = sequelize.define('Location', {
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    section: {  // A, B, C...
        type: DataTypes.STRING,
        allowNull: false
    },
    row: {      // 1, 2, 3...
        type: DataTypes.INTEGER,
        allowNull: false
    },
    level: {    // 1, 2, 3... (yükseklik)
        type: DataTypes.INTEGER,
        allowNull: false
    },
    position: { // 1, 2, 3... (derinlik)
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
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            x: 0,
            y: 0,
            z: 0
        }
    }
});

Location.associate = (models) => {
    Location.hasMany(models.Product, {
        foreignKey: 'locationId',
        as: 'products'
    });
};

module.exports = Location; 