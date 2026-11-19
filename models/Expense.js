const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  society_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('Utilities', 'Repairs', 'Maintenance', 'Administrative', 'Gardening', 'Security', 'Events'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  paid_to: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payment_mode: {
    type: DataTypes.ENUM('UPI', 'Cash', 'Cheque', 'Bank Transfer'),
    allowNull: false,
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Events',
      key: 'id'
    }
  }
});

module.exports = Expense;
