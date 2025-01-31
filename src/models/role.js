const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isIn: [['admin', 'manager', 'warehouse_staff']]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    permissions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
            "admin": {
                "all": true,
                "dashboard": true  // Dashboard yetkisi ekledik
            },
            "manager": {
                "products": {
                    "read": true,
                    "create": true,
                    "update": true,
                    "delete": true
                },
                "categories": {
                    "read": true,
                    "create": true,
                    "update": true,
                    "delete": true
                },
                "stock": {
                    "read": true,
                    "create": true,
                    "update": true,
                    "reports": true
                },
                "users": {
                    "read": true,
                    "create": false,
                    "update": false,
                    "delete": false
                },
                "dashboard": {  // Manager için dashboard yetkisi
                    "view": true
                }
            },
            "warehouse_staff": {
                "products": {
                    "read": true,
                    "create": false,
                    "update": true,
                    "delete": false
                },
                "stock": {
                    "read": true,
                    "create": true,
                    "update": true,
                    "reports": true
                },
                "dashboard": {  // Depo personeli için sınırlı dashboard yetkisi
                    "view": false
                }
            }
        }
    }
}, {
    tableName: 'Roles',
    timestamps: true
});

Role.associate = (models) => {
    Role.hasMany(models.User, {
        foreignKey: 'roleId',
        as: 'users'
    });
};

module.exports = Role;
