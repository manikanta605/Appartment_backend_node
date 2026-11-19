const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
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
    type: DataTypes.DATE,
    allowNull: true,
  },
  flat_no: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  resident_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  period: {
    type: DataTypes.STRING, // e.g., 'March 2026'
    allowNull: false,
  },
  // Current month maintenance amount
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  // Outstanding previous dues carried forward
  previous_due: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  // total_due = amount + previous_due
  total_due: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  // Amount actually paid
  paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  mode: {
    type: DataTypes.ENUM('UPI', 'Cash', 'Cheque', 'Bank Transfer', 'Razorpay', 'Pending'),
    defaultValue: 'Pending',
  },
  status: {
    type: DataTypes.ENUM('Paid', 'Pending', 'Overdue', 'Partial'),
    defaultValue: 'Pending',
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  invoice_no: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Events',
      key: 'id'
    }
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

module.exports = Payment;
