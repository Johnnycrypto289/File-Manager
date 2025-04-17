/**
 * Authentication controller for user registration, login, and Xero OAuth
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { XeroClient } = require('xero-node');
const User = require('../models/User');
const Token = require('../models/Token');
const XeroTenant = require('../models/XeroTenant');
const config = require('../config');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Initialize Xero client
const xero = new XeroClient({
  clientId: config.xero.clientId,
  clientSecret: config.xero.clientSecret,
  redirectUris: [config.xero.redirectUri],
  scopes: config.xero.scopes.split(' ')
});

/**
 * Generate JWT tokens for authentication
 * @param {Object} user - User object
 * @returns {Object} Access and refresh tokens
 */
const generateTokens = async (user, req) => {
  // Create payload for JWT
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  // Generate access token
  const accessToken = jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    { id: uuidv4() },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  // Store refresh token in database
  await Token.create({
    userId: user.id,
    refreshToken,
    expiresAt,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn
  };
};

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return next(errorResponse('Name, email, and password are required', 'VALIDATION_ERROR', 400));
    }

    if (password.length < 8) {
      return next(errorResponse('Password must be at least 8 characters', 'VALIDATION_ERROR', 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(errorResponse('User with this email already exists', 'USER_EXISTS', 409));
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: 'user'
    });

    // Generate tokens
    const tokens = await generateTokens(user, req);

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Return success response
    res.status(201).json(successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      ...tokens
    }));
  } catch (error) {
    logger.error('Error in register:', error);
    next(error);
  }
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return next(errorResponse('Email and password are required', 'VALIDATION_ERROR', 400));
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(errorResponse('Invalid credentials', 'INVALID_CREDENTIALS', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(errorResponse('Account is disabled', 'ACCOUNT_DISABLED', 403));
    }

    // Verify password
    const isPasswordValid = await user.isValidPassword(password);
    if (!isPasswordValid) {
      return next(errorResponse('Invalid credentials', 'INVALID_CREDENTIALS', 401));
    }

    // Generate tokens
    const tokens = await generateTokens(user, req);

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Return success response
    res.status(200).json(successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      ...tokens
    }));
  } catch (error) {
    logger.error('Error in login:', error);
    next(error);
  }
};

/**
 * Refresh access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: requestToken } = req.body;

    // Validate input
    if (!requestToken) {
      return next(errorResponse('Refresh token is required', 'VALIDATION_ERROR', 400));
    }

    // Find token in database
    const storedToken = await Token.findOne({
      where: {
        refreshToken: requestToken,
        isRevoked: false
      }
    });

    if (!storedToken) {
      return next(errorResponse('Invalid refresh token', 'INVALID_TOKEN', 401));
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      await storedToken.update({ isRevoked: true });
      return next(errorResponse('Refresh token expired', 'TOKEN_EXPIRED', 401));
    }

    // Verify token
    try {
      jwt.verify(requestToken, config.jwt.secret);
    } catch (error) {
      await storedToken.update({ isRevoked: true });
      return next(errorResponse('Invalid refresh token', 'INVALID_TOKEN', 401));
    }

    // Find user
    const user = await User.findByPk(storedToken.userId);
    if (!user) {
      return next(errorResponse('User not found', 'USER_NOT_FOUND', 404));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(errorResponse('Account is disabled', 'ACCOUNT_DISABLED', 403));
    }

    // Revoke current token
    await storedToken.update({ isRevoked: true });

    // Generate new tokens
    const tokens = await generateTokens(user, req);

    // Return success response
    res.status(200).json(successResponse(tokens));
  } catch (error) {
    logger.error('Error in refreshToken:', error);
    next(error);
  }
};

/**
 * Get Xero connection URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getXeroConnectUrl = async (req, res, next) => {
  try {
    // Generate state parameter for security
    const state = uuidv4();

    // Store state in session or database to verify on callback
    // For simplicity, we'll use a cookie here
    res.cookie('xero_state', state, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000 // 10 minutes
    });

    // Generate authorization URL
    const consentUrl = await xero.buildConsentUrl(state);

    // Return success response
    res.status(200).json(successResponse({
      url: consentUrl
    }));
  } catch (error) {
    logger.error('Error in getXeroConnectUrl:', error);
    next(error);
  }
};

/**
 * Handle Xero OAuth callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleXeroCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    // Validate input
    if (!code || !state) {
      return next(errorResponse('Invalid request', 'INVALID_REQUEST', 400));
    }

    // Verify state parameter
    const storedState = req.cookies.xero_state;
    if (!storedState || storedState !== state) {
      return next(errorResponse('Invalid state parameter', 'INVALID_STATE', 400));
    }

    // Clear state cookie
    res.clearCookie('xero_state');

    // Exchange authorization code for tokens
    await xero.initialize();
    const tokenSet = await xero.apiCallback(req.url);

    // Get connected tenants
    const tenants = await xero.updateTenants();

    // Store tokens and tenant information
    for (const tenant of tenants) {
      // Check if tenant already exists
      const existingTenant = await XeroTenant.findOne({
        where: {
          userId: req.user.id,
          tenantId: tenant.tenantId
        }
      });

      if (existingTenant) {
        // Update existing tenant
        await existingTenant.update({
          tenantName: tenant.tenantName,
          tenantType: tenant.tenantType,
          accessToken: tokenSet.access_token,
          refreshToken: tokenSet.refresh_token,
          tokenExpiresAt: new Date(tokenSet.expires_at * 1000),
          isActive: true
        });
      } else {
        // Create new tenant
        await XeroTenant.create({
          userId: req.user.id,
          tenantId: tenant.tenantId,
          tenantName: tenant.tenantName,
          tenantType: tenant.tenantType,
          accessToken: tokenSet.access_token,
          refreshToken: tokenSet.refresh_token,
          tokenExpiresAt: new Date(tokenSet.expires_at * 1000)
        });
      }
    }

    // Redirect to frontend or return success
    if (process.env.FRONTEND_URL) {
      return res.redirect(`${process.env.FRONTEND_URL}/xero/connected`);
    }

    // Return success response
    res.status(200).json(successResponse({
      message: 'Successfully connected to Xero',
      tenants: tenants.map(t => ({
        id: t.tenantId,
        name: t.tenantName,
        type: t.tenantType
      }))
    }));
  } catch (error) {
    logger.error('Error in handleXeroCallback:', error);
    next(error);
  }
};

/**
 * Disconnect from Xero
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const disconnectXero = async (req, res, next) => {
  try {
    // Find all tenants for user
    const tenants = await XeroTenant.findAll({
      where: {
        userId: req.user.id,
        isActive: true
      }
    });

    // Update tenants to inactive
    for (const tenant of tenants) {
      await tenant.update({ isActive: false });
    }

    // Return success response
    res.status(200).json(successResponse({
      message: 'Successfully disconnected from Xero'
    }));
  } catch (error) {
    logger.error('Error in disconnectXero:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getXeroConnectUrl,
  handleXeroCallback,
  disconnectXero
};
