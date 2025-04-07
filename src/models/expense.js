'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Expense extends Model {
    static associate(models) {
      // İlişkiler buraya tanımlanabilir
    }
  }
  
  Expense.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    expenseAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    expenseType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expenseDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expenseStartTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    expenseEndTime: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Expense',
    tableName: 'Expenses',
    timestamps: true,
    createdAt: true,
    updatedAt: true
  });
  
  return Expense;
}; 