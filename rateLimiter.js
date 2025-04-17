/**
 * Rate Limiting Middleware
 * Protects against brute force attacks and abuse
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Get rate limit configuration from environment variables
const windowMs = process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000; // 15 minutes by default
const max = process.env.RATE_LIMIT_MAX || 100; // 100 requests per windowMs by default

/**
 * Create standard rate limiter
 * @returns {Function} Express middleware function
 */
const standardLimiter = rateLimit({
  windowMs: parseInt(windowMs),
  max: parseInt(max),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.userId
    });
    
    res.status(options.statusCode).json({
      success: false,
      message: options.message || 'Too many requests, please try again later.'
    });
  },
  skip: (req, res) => {
    // Skip rate limiting for certain paths if needed
    return false;
  }
});

/**
 * Create authentication rate limiter (more strict)
 * @returns {Function} Express middleware function
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Authentication rate limit exceeded', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      email: req.body.email
    });
    
    res.status(options.statusCode).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.'
    });
  }
});

/**
 * Create API rate limiter for n8n endpoints
 * @returns {Function} Express middleware function
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('API rate limit exceeded', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.userId
    });
    
    res.status(options.statusCode).json({
      success: false,
      message: 'API rate limit exceeded, please reduce request frequency.'
    });
  }
});

module.exports = {
  standardLimiter,
  authLimiter,
  apiLimiter
};
