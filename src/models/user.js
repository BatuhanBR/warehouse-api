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
        allowNull: false
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
        references: {
            model: 'Roles',
            key: 'id'
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

User.associate = (models) => {
    User.belongsTo(models.Role, {
        foreignKey: 'roleId',
        as: 'userRole'
    });

    User.hasMany(models.Product, {
        foreignKey: 'createdBy',
        as: 'createdProducts'
    });

    User.hasMany(models.Product, {
        foreignKey: 'updatedBy',
        as: 'updatedProducts'
    });
};

module.exports = User;