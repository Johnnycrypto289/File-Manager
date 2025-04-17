/**
 * Report model for storing generated financial reports
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('PROFIT_LOSS', 'BALANCE_SHEET', 'CASH_FLOW', 'AGED_RECEIVABLES', 'AGED_PAYABLES', 'BUDGET_VARIANCE', 'CUSTOM'),
    allowNull: false
  },
  parameters: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object with report parameters like date range, filters, etc.'
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object with the actual report data'
  },
  format: {
    type: DataTypes.ENUM('JSON', 'PDF', 'CSV', 'XLSX'),
    defaultValue: 'JSON',
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Path to the report file if stored as a file'
  },
  isScheduled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  scheduleConfig: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object with schedule configuration'
  },
  lastGeneratedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'GENERATING', 'COMPLETED', 'FAILED'),
    defaultValue: 'PENDING',
    allowNull: false
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Report;
