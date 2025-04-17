/**
 * Database initialization script for Replit deployment
 */

const { sequelize } = require('../src/config/database.replit');
const logger = require('../src/utils/logger');

// Models
const User = require('../src/models/User');
const XeroTenant = require('../src/models/XeroTenant');
const Token = require('../src/models/Token');
const Transaction = require('../src/models/Transaction');
const Category = require('../src/models/Category');
const CategoryRule = require('../src/models/CategoryRule');
const Report = require('../src/models/Report');
const Webhook = require('../src/models/Webhook');
const ApiKey = require('../src/models/ApiKey');

// Initialize database
const initDatabase = async () => {
  try {
    logger.info('Initializing database...');
    
    // Sync all models with database
    await sequelize.sync({ force: true });
    logger.info('Database tables created successfully');
    
    // Create default categories
    await createDefaultCategories();
    
    // Create admin user if specified in environment
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await createAdminUser(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
    }
    
    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error('Error initializing database:', error);
    process.exit(1);
  }
};

// Create default categories
const createDefaultCategories = async () => {
  try {
    const defaultCategories = [
      { name: 'Uncategorized', description: 'Default category for uncategorized transactions' },
      { name: 'Income', description: 'Revenue and other income' },
      { name: 'Expenses', description: 'General expenses' },
      { name: 'Rent', description: 'Rent and lease payments' },
      { name: 'Utilities', description: 'Electricity, water, gas, etc.' },
      { name: 'Salaries', description: 'Employee salaries and wages' },
      { name: 'Office Supplies', description: 'Office supplies and equipment' },
      { name: 'Marketing', description: 'Marketing and advertising expenses' },
      { name: 'Software', description: 'Software subscriptions and licenses' },
      { name: 'Travel', description: 'Travel expenses' },
      { name: 'Meals', description: 'Meals and entertainment' },
      { name: 'Insurance', description: 'Insurance premiums' },
      { name: 'Taxes', description: 'Tax payments' },
      { name: 'Professional Services', description: 'Legal, accounting, consulting fees' }
    ];
    
    for (const category of defaultCategories) {
      await Category.create(category);
    }
    
    logger.info(`Created ${defaultCategories.length} default categories`);
  } catch (error) {
    logger.error('Error creating default categories:', error);
    throw error;
  }
};

// Create admin user
const createAdminUser = async (email, password) => {
  try {
    const adminUser = await User.create({
      email,
      password,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });
    
    logger.info(`Created admin user: ${email}`);
    return adminUser;
  } catch (error) {
    logger.error('Error creating admin user:', error);
    throw error;
  }
};

// Run initialization
initDatabase();
