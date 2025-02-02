const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.belongsTo(models.Role, { foreignKey: 'roleId' });
            User.hasMany(models.Product, { foreignKey: 'createdBy', as: 'createdProducts' });
            User.hasMany(models.Product, { foreignKey: 'updatedBy', as: 'updatedProducts' });
            User.hasMany(models.StockMovement, { foreignKey: 'createdBy', as: 'stockMovements' });
        }
    }

    User.init({
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
        sequelize,
        modelName: 'User',
        tableName: 'Users',
        timestamps: true
    });

    return User;
};