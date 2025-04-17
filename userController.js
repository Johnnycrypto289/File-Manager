/**
 * User controller for user management
 */

const User = require('../models/User');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProfile = async (req, res, next) => {
  try {
    // Get user from database (to get the latest data)
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return next(errorResponse('User not found', 'USER_NOT_FOUND', 404));
    }

    // Return user profile
    res.status(200).json(successResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
  } catch (error) {
    logger.error('Error in getProfile:', error);
    next(error);
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    // Get user from database
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return next(errorResponse('User not found', 'USER_NOT_FOUND', 404));
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return next(errorResponse('Email already in use', 'EMAIL_IN_USE', 400));
      }
    }

    // Update user
    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (email) updatedFields.email = email;

    await user.update(updatedFields);

    // Return updated profile
    res.status(200).json(successResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
  } catch (error) {
    logger.error('Error in updateProfile:', error);
    next(error);
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return next(errorResponse('Current password and new password are required', 'VALIDATION_ERROR', 400));
    }

    if (newPassword.length < 8) {
      return next(errorResponse('New password must be at least 8 characters', 'VALIDATION_ERROR', 400));
    }

    // Get user from database
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return next(errorResponse('User not found', 'USER_NOT_FOUND', 404));
    }

    // Verify current password
    const isPasswordValid = await user.isValidPassword(currentPassword);
    if (!isPasswordValid) {
      return next(errorResponse('Current password is incorrect', 'INVALID_PASSWORD', 400));
    }

    // Update password
    await user.update({ password: newPassword });

    // Return success response
    res.status(200).json(successResponse({
      message: 'Password changed successfully'
    }));
  } catch (error) {
    logger.error('Error in changePassword:', error);
    next(error);
  }
};

/**
 * Get all users (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAllUsers = async (req, res, next) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    // Get users from database
    const { count, rows } = await User.findAndCountAll({
      attributes: ['id', 'name', 'email', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt'],
      limit: pageSize,
      offset
    });

    // Return paginated response
    res.status(200).json(paginatedResponse(rows, page, pageSize, count));
  } catch (error) {
    logger.error('Error in getAllUsers:', error);
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers
};
