const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(value, salt);
            this.setDataValue('password', hash);
        }
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'Users',
    timestamps: true
});

User.associate = (models) => {
    User.belongsTo(models.Role, {
        foreignKey: 'roleId',
        as: 'role'
    });

    User.hasMany(models.Product, {
        foreignKey: 'createdBy',
        as: 'createdProducts'
    });

    User.hasMany(models.Product, {
        foreignKey: 'updatedBy',
        as: 'updatedProducts'
    });

    User.hasMany(models.StockMovement, {
        foreignKey: 'createdBy',
        as: 'stockMovements'
    });
};

module.exports = User;