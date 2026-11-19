const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Member = sequelize.define('Member', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  society_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  flat_no: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.ENUM('Owner', 'Tenant'),
    defaultValue: 'Owner',
  },
  family_size: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  role: {
    type: DataTypes.STRING, // President, Secretary, Treasurer, Member
    defaultValue: 'Member',
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  }
});

module.exports = Member;
