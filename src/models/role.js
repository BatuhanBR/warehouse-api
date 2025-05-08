const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.hasMany(models.User, {
        foreignKey: 'roleId',
        as: 'users'
      });
      Role.belongsToMany(models.Permission, {
        through: 'RolePermissions',
        foreignKey: 'roleId',
        as: 'permissions'
      });
    }
  }

  Role.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'Roles'
  });

  return Role;
};
