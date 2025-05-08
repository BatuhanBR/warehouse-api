'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserActivity extends Model {
    static associate(models) {
      UserActivity.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  
  UserActivity.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    ipAddress: DataTypes.STRING,
    userAgent: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'UserActivity',
  });
  
  return UserActivity;
}; 