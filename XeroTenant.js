/**
 * XeroTenant model for storing Xero connection information
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');
const config = require('../config');

// Encryption functions for sensitive data
const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    config.encryption.algorithm, 
    Buffer.from(config.encryption.key, 'hex'), 
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text) => {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(
    config.encryption.algorithm, 
    Buffer.from(config.encryption.key, 'hex'), 
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

const XeroTenant = sequelize.define('XeroTenant', {
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
    type: DataTypes.STRING,
    allowNull: false
  },
  tenantName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tenantType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue('accessToken');
      return value ? decrypt(value) : null;
    },
    set(value) {
      this.setDataValue('accessToken', value ? encrypt(value) : null);
    }
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue('refreshToken');
      return value ? decrypt(value) : null;
    },
    set(value) {
      this.setDataValue('refreshToken', value ? encrypt(value) : null);
    }
  },
  tokenExpiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastSyncedAt: {
    type: DataTypes.DATE
  }
});

module.exports = XeroTenant;
