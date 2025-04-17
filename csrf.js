/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

const crypto = require('crypto');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');

// Store for CSRF tokens
const tokenStore = new Map();

/**
 * Generate CSRF token for a user session
 * @param {string} userId - User ID
 * @returns {string} CSRF token
 */
const generateToken = (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  
  // Store token with user ID and expiration
  tokenStore.set(token, {
    userId,
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  });
  
  return token;
};

/**
 * Middleware to generate and set CSRF token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const setCsrfToken = (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return next();
    }
    
    const token = generateToken(req.user.userId);
    
    // Set token in response header
    res.set('X-CSRF-Token', token);
    
    next();
  } catch (error) {
    logger.error('Error in setCsrfToken middleware:', error);
    next(error);
  }
};

/**
 * Middleware to verify CSRF token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyCsrfToken = (req, res, next) => {
  try {
    // Skip for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    if (!req.user || !req.user.userId) {
      return next();
    }
    
    const token = req.headers['x-csrf-token'];
    
    if (!token) {
      logger.warn('Missing CSRF token', {
        path: req.path,
        method: req.method,
        userId: req.user.userId
      });
      
      return errorResponse(res, 'Missing CSRF token', 403);
    }
    
    const storedToken = tokenStore.get(token);
    
    if (!storedToken) {
      logger.warn('Invalid CSRF token', {
        path: req.path,
        method: req.method,
        userId: req.user.userId
      });
      
      return errorResponse(res, 'Invalid CSRF token', 403);
    }
    
    if (storedToken.userId !== req.user.userId) {
      logger.warn('CSRF token user mismatch', {
        path: req.path,
        method: req.method,
        userId: req.user.userId,
        tokenUserId: storedToken.userId
      });
      
      return errorResponse(res, 'Invalid CSRF token', 403);
    }
    
    if (storedToken.expires < Date.now()) {
      // Remove expired token
      tokenStore.delete(token);
      
      logger.warn('Expired CSRF token', {
        path: req.path,
        method: req.method,
        userId: req.user.userId
      });
      
      return errorResponse(res, 'Expired CSRF token', 403);
    }
    
    next();
  } catch (error) {
    logger.error('Error in verifyCsrfToken middleware:', error);
    next(error);
  }
};

/**
 * Clean up expired tokens
 * Should be called periodically
 */
const cleanupExpiredTokens = () => {
  try {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [token, data] of tokenStore.entries()) {
      if (data.expires < now) {
        tokenStore.delete(token);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logger.info(`Cleaned up ${expiredCount} expired CSRF tokens`);
    }
  } catch (error) {
    logger.error('Error in cleanupExpiredTokens:', error);
  }
};

// Set up periodic cleanup
setInterval(cleanupExpiredTokens, 60 * 60 * 1000); // Every hour

module.exports = {
  setCsrfToken,
  verifyCsrfToken
};
