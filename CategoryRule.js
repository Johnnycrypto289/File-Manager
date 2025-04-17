/**
 * CategoryRule model for automatic transaction categorization
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CategoryRule = sequelize.define('CategoryRule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'XeroTenants',
      key: 'id'
    }
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Categories',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  conditions: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'JSON array of condition objects with field, operator, and value properties'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isAutomatic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  matchCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastMatchedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = CategoryRule;
