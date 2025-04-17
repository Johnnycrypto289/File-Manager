/**
 * ApiKey model for storing API keys for external integrations
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

const ApiKey = sequelize.define('ApiKey', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  key: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: () => crypto.randomBytes(32).toString('hex'),
    get() {
      const value = this.getDataValue('key');
      return value ? decrypt(value) : null;
    },
    set(value) {
      this.setDataValue('key', value ? encrypt(value) : null);
    }
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of permission strings'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ipRestrictions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of allowed IP addresses or CIDR ranges'
  },
  useCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = ApiKey;
