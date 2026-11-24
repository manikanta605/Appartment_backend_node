const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PatrolLog = sequelize.define('PatrolLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  society_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  checkpoint_code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  checkpoint_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  guard_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  guard_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  scanned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'All Clear', // 'All Clear' | 'Attention Needed' | 'Issue Reported'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
});

module.exports = PatrolLog;
