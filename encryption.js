/**
 * Data Encryption Utility
 * Provides encryption and decryption functions for sensitive data
 */

const crypto = require('crypto');
const logger = require('./logger');

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  logger.warn('ENCRYPTION_KEY not set in environment variables. Using fallback key (not recommended for production)');
}

// Use environment variable or fallback (for development only)
const encryptionKey = ENCRYPTION_KEY || 'fallback_encryption_key_for_development_only';

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt data
 * @param {string} text - Text to encrypt
 * @returns {Object} Encrypted data with iv and auth tag
 */
const encrypt = (text) => {
  try {
    if (!text) return null;
    
    // Create initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(
      ALGORITHM, 
      crypto.scryptSync(encryptionKey, 'salt', 32), 
      iv
    );
    
    // Encrypt data
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
      iv: iv.toString('hex'),
      encrypted,
      authTag
    };
  } catch (error) {
    logger.error('Error encrypting data:', error);
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypt data
 * @param {Object} encryptedData - Encrypted data object with iv, encrypted text, and auth tag
 * @returns {string} Decrypted text
 */
const decrypt = (encryptedData) => {
  try {
    if (!encryptedData || !encryptedData.iv || !encryptedData.encrypted || !encryptedData.authTag) {
      return null;
    }
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      crypto.scryptSync(encryptionKey, 'salt', 32),
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    // Set auth tag
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    // Decrypt data
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Error decrypting data:', error);
    throw new Error('Decryption failed');
  }
};

/**
 * Hash data (one-way)
 * @param {string} text - Text to hash
 * @returns {string} Hashed text
 */
const hash = (text) => {
  try {
    if (!text) return null;
    
    return crypto
      .createHash('sha256')
      .update(text)
      .digest('hex');
  } catch (error) {
    logger.error('Error hashing data:', error);
    throw new Error('Hashing failed');
  }
};

module.exports = {
  encrypt,
  decrypt,
  hash
};
