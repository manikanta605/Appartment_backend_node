const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Society = sequelize.define('Society', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    defaultValue: 'Hyderabad',
  },
  state: {
    type: DataTypes.STRING,
    defaultValue: 'Telangana',
  },
  pincode: {
    type: DataTypes.STRING(12),
    allowNull: true,
  },
  logo_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Dynamic Maintenance Configuration per Society
  maintenance_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 2500.00,
  },
  due_day: {
    type: DataTypes.INTEGER,
    defaultValue: 10, // Due on 10th of every month
  },
  late_fine: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 100.00,
  },
  upi_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contact_email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contact_phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Suspended', 'Trial'),
    defaultValue: 'Active',
  },
  plan: {
    type: DataTypes.ENUM('Basic', 'Standard', 'Premium'),
    defaultValue: 'Standard',
  }
});

module.exports = Society;

