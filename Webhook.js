/**
 * Webhook model for storing webhook configurations
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const Webhook = sequelize.define('Webhook', {
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
  event: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Event type that triggers the webhook'
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'URL to send the webhook payload to'
  },
  secret: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: () => crypto.randomBytes(32).toString('hex'),
    comment: 'Secret used to sign the webhook payload'
  },
  headers: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional headers to send with the webhook'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastTriggeredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  successCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  failureCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastError: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Webhook;
