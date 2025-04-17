/**
 * Input Validation Middleware
 * Validates request data against defined schemas
 */

const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');

/**
 * Validate request against provided validation rules
 * @param {Array} validationRules - Array of express-validator validation rules
 * @returns {Function} Express middleware function
 */
const validate = (validationRules) => {
  return async (req, res, next) => {
    try {
      // Apply validation rules
      for (const validation of validationRules) {
        await validation.run(req);
      }
      
      // Check for validation errors
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        logger.warn('Validation error:', {
          path: req.path,
          method: req.method,
          errors: errors.array()
        });
        
        return errorResponse(res, {
          message: 'Validation error',
          errors: errors.array()
        }, 400);
      }
      
      next();
    } catch (error) {
      logger.error('Error in validation middleware:', error);
      return errorResponse(res, 'Server error during validation', 500);
    }
  };
};

module.exports = {
  validate
};
