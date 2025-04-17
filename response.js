/**
 * API response utility functions
 */

/**
 * Create a success response object
 * @param {*} data - The data to include in the response
 * @param {Object} meta - Optional metadata for the response
 * @returns {Object} Success response object
 */
const successResponse = (data, meta = {}) => {
  return {
    success: true,
    data,
    meta
  };
};

/**
 * Create an error response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Error response object
 */
const errorResponse = (message, code = 'INTERNAL_ERROR', statusCode = 500) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

/**
 * Create a paginated response
 * @param {Array} data - The data array to paginate
 * @param {number} page - Current page number
 * @param {number} pageSize - Number of items per page
 * @param {number} total - Total number of items
 * @returns {Object} Paginated response object
 */
const paginatedResponse = (data, page, pageSize, total) => {
  return successResponse(data, {
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
};
