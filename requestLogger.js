/**
 * Request logging middleware
 */

const logger = require('../utils/logger');

/**
 * Middleware to log all incoming requests
 */
const requestLogger = (req, res, next) => {
  // Log request details
  logger.info({
    type: 'request',
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Track response time
  const start = Date.now();
  
  // Once the request is processed, log the response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      type: 'response',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};

module.exports = requestLogger;
