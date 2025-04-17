/**
 * Database configuration for Replit deployment
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Determine database path
const dbPath = process.env.DATABASE_URL || 'sqlite:./database.sqlite';

// Create database directory if it doesn't exist (for SQLite)
if (dbPath.startsWith('sqlite:')) {
  const sqlitePath = dbPath.replace('sqlite:', '');
  const dbDir = path.dirname(sqlitePath);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    logger.info(`Created database directory: ${dbDir}`);
  }
}

// Initialize Sequelize with SQLite for Replit
const sequelize = new Sequelize(dbPath, {
  dialect: 'sqlite',
  logging: (msg) => logger.debug(msg),
  define: {
    timestamps: true,
    underscored: false
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // SQLite-specific options
  storage: dbPath.replace('sqlite:', '')
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Sync models with database
    await sequelize.sync();
    logger.info('Database models synchronized successfully.');
    
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
};
