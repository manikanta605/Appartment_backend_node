const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dialect = (process.env.DB_DIALECT || 'postgres').toLowerCase();

let sequelize;

if (dialect === 'sqlite') {
  const storagePath = process.env.DB_STORAGE
    ? path.resolve(process.env.DB_STORAGE)
    : path.resolve(__dirname, '..', 'residex.sqlite');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false,
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'postgres',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
    }
  );
}

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log(`Database connected successfully using [${dialect.toUpperCase()}] dialect.`);
  } catch (error) {
    console.error(`Unable to connect to the [${dialect}] database:`, error.message);
  }
}

module.exports = { sequelize, testConnection };
