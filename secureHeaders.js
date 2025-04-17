/**
 * Secure Headers Middleware
 * Sets security-related HTTP headers to protect against common web vulnerabilities
 */

const helmet = require('helmet');
const logger = require('../utils/logger');

/**
 * Configure and apply secure headers
 * @returns {Function} Express middleware function
 */
const secureHeaders = () => {
  try {
    // Configure helmet with appropriate settings
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
          connectSrc: ["'self'", "https://api.xero.com"],
          fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      xssFilter: true,
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true
      },
      frameguard: {
        action: 'deny'
      },
      noSniff: true,
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
      }
    });
  } catch (error) {
    logger.error('Error configuring secure headers:', error);
    
    // Return a fallback middleware that does nothing
    return (req, res, next) => next();
  }
};

module.exports = secureHeaders;
