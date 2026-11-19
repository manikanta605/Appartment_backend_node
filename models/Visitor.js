const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Visitor = sequelize.define('Visitor', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  society_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  photo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  flat_no: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  purpose: {
    type: DataTypes.STRING,
    defaultValue: 'Visitor',
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
  },
  visit_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  visit_time: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pass_code: {
    type: DataTypes.STRING(10),
    allowNull: true,
  }
});

module.exports = Visitor;
