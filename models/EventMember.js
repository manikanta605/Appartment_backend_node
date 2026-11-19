const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EventMember = sequelize.define('EventMember', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  society_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Events',
      key: 'id'
    }
  },
  flat_no: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  required_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('Unpaid', 'Partial', 'Paid'),
    defaultValue: 'Unpaid',
  }
});

module.exports = EventMember;
