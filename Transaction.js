/**
 * Transaction model for storing financial transactions
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
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
  xeroTransactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('BANK', 'INVOICE', 'BILL', 'PAYMENT', 'CREDIT_NOTE', 'MANUAL'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accountId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accountCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accountName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Categories',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CATEGORIZED', 'RECONCILED', 'VOIDED'),
    defaultValue: 'PENDING',
    allowNull: false
  },
  isReconciled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reconciliationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  lastSyncedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = Transaction;
