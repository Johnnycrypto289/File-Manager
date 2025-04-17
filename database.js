/**
 * Database configuration and initialization
 */

const { Sequelize } = require('sequelize');
const config = require('./index');
const winston = require('winston');

// Get environment-specific database configuration
const env = process.env.NODE_ENV || 'development';
const dbConfig = config.database[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    storage: dbConfig.storage, // For SQLite
    logging: dbConfig.logging,
    dialectOptions: dbConfig.dialectOptions,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
};
