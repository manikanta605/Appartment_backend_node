const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PatrolCheckpoint = sequelize.define('PatrolCheckpoint', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  society_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING, // e.g. 'CP-01'
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING, // e.g. 'Main Security Gate'
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING, // e.g. 'Ground Floor, North Entry'
    allowNull: true,
  },
  qr_data: {
    type: DataTypes.STRING, // encoded string to match on QR scan
    allowNull: false,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
  }
});

module.exports = PatrolCheckpoint;
