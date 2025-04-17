/**
 * Audit Logging Middleware
 * Records detailed logs of sensitive operations for security auditing
 */

const logger = require('../utils/logger');

/**
 * Middleware to log sensitive operations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const auditLog = (req, res, next) => {
  try {
    // Skip audit logging for non-sensitive operations
    if (shouldSkipAuditLogging(req)) {
      return next();
    }
    
    // Capture original end method
    const originalEnd = res.end;
    
    // Override end method to capture response
    res.end = function(chunk, encoding) {
      // Restore original end method
      res.end = originalEnd;
      
      // Call original end method
      res.end(chunk, encoding);
      
      // Log the operation
      logOperation(req, res);
    };
    
    next();
  } catch (error) {
    logger.error('Error in audit logging middleware:', error);
    next(error);
  }
};

/**
 * Determine if audit logging should be skipped for this request
 * @param {Object} req - Express request object
 * @returns {boolean} Whether to skip audit logging
 */
const shouldSkipAuditLogging = (req) => {
  // Skip for GET requests to non-sensitive endpoints
  if (req.method === 'GET') {
    // List of sensitive GET endpoints that should be logged
    const sensitiveGetEndpoints = [
      '/api/users',
      '/api/auth/profile',
      '/api/xero/tenants',
      '/api/n8n/kpis',
      '/api/n8n/cash-flow',
      '/api/n8n/anomalies'
    ];
    
    // Check if path starts with any sensitive endpoint
    const isSensitiveEndpoint = sensitiveGetEndpoints.some(endpoint => 
      req.path.startsWith(endpoint)
    );
    
    if (!isSensitiveEndpoint) {
      return true; // Skip logging
    }
  }
  
  return false;
};

/**
 * Log the operation details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logOperation = (req, res) => {
  // Create audit log entry
  const auditEntry = {
    timestamp: new Date().toISOString(),
    userId: req.user?.userId || 'anonymous',
    ip: req.ip,
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    userAgent: req.headers['user-agent'],
    requestId: req.headers['x-request-id'] || generateRequestId(),
    requestBody: sanitizeRequestBody(req.body),
    params: req.params,
    query: req.query
  };
  
  // Log at appropriate level based on status code
  if (res.statusCode >= 500) {
    logger.error('Audit: Server error', auditEntry);
  } else if (res.statusCode >= 400) {
    logger.warn('Audit: Client error', auditEntry);
  } else {
    logger.info('Audit: Operation', auditEntry);
  }
};

/**
 * Generate a unique request ID
 * @returns {string} Unique request ID
 */
const generateRequestId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

/**
 * Sanitize request body to remove sensitive information
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
const sanitizeRequestBody = (body) => {
  if (!body) return {};
  
  // Create a copy of the body
  const sanitized = { ...body };
  
  // List of sensitive fields to redact
  const sensitiveFields = [
    'password',
    'newPassword',
    'currentPassword',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'clientSecret',
    'xeroClientSecret',
    'encryptionKey'
  ];
  
  // Redact sensitive fields
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

module.exports = {
  auditLog
};
