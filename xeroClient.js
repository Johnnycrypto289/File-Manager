/**
 * Xero API client wrapper service
 */

const { XeroClient } = require('xero-node');
const XeroTenant = require('../models/XeroTenant');
const config = require('../config');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');

// Initialize Xero client
const xero = new XeroClient({
  clientId: config.xero.clientId,
  clientSecret: config.xero.clientSecret,
  redirectUris: [config.xero.redirectUri],
  scopes: config.xero.scopes.split(' ')
});

/**
 * Get a configured Xero client for a specific user and tenant
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID (optional)
 * @returns {Object} Configured Xero client
 */
const getXeroClient = async (userId, tenantId = null) => {
  try {
    // Find active tenant
    const query = {
      where: {
        userId,
        isActive: true
      }
    };

    // If tenantId is provided, add it to the query
    if (tenantId) {
      query.where.tenantId = tenantId;
    }

    const tenant = await XeroTenant.findOne(query);

    if (!tenant) {
      throw errorResponse('No active Xero connection found', 'NO_XERO_CONNECTION', 400);
    }

    // Set token set
    await xero.setTokenSet({
      access_token: tenant.accessToken,
      refresh_token: tenant.refreshToken,
      expires_at: tenant.tokenExpiresAt.getTime() / 1000
    });

    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiresAt = tenant.tokenExpiresAt;
    const fiveMinutes = 5 * 60 * 1000;

    if (now.getTime() + fiveMinutes >= expiresAt.getTime()) {
      // Token is expired or about to expire, refresh it
      const newTokenSet = await xero.refreshToken();

      // Update token in database
      await tenant.update({
        accessToken: newTokenSet.access_token,
        refreshToken: newTokenSet.refresh_token,
        tokenExpiresAt: new Date(newTokenSet.expires_at * 1000)
      });

      logger.info(`Refreshed Xero token for user ${userId}, tenant ${tenant.tenantId}`);
    }

    // Set active tenant
    xero.tenants = [
      {
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        tenantType: tenant.tenantType
      }
    ];

    return {
      xero,
      tenant
    };
  } catch (error) {
    logger.error('Error in getXeroClient:', error);
    throw error;
  }
};

/**
 * Get all tenants for a user
 * @param {string} userId - User ID
 * @returns {Array} List of tenants
 */
const getTenants = async (userId) => {
  try {
    const tenants = await XeroTenant.findAll({
      where: {
        userId,
        isActive: true
      },
      attributes: ['id', 'tenantId', 'tenantName', 'tenantType', 'lastSyncedAt', 'createdAt', 'updatedAt']
    });

    return tenants;
  } catch (error) {
    logger.error('Error in getTenants:', error);
    throw error;
  }
};

/**
 * Select active tenant for a user
 * @param {string} userId - User ID
 * @param {string} tenantId - Tenant ID to select
 * @returns {Object} Selected tenant
 */
const selectTenant = async (userId, tenantId) => {
  try {
    // Find tenant
    const tenant = await XeroTenant.findOne({
      where: {
        userId,
        tenantId,
        isActive: true
      }
    });

    if (!tenant) {
      throw errorResponse('Tenant not found', 'TENANT_NOT_FOUND', 404);
    }

    // Return tenant
    return {
      id: tenant.id,
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      tenantType: tenant.tenantType,
      lastSyncedAt: tenant.lastSyncedAt,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    };
  } catch (error) {
    logger.error('Error in selectTenant:', error);
    throw error;
  }
};

/**
 * Handle Xero API errors
 * @param {Error} error - Error object
 * @returns {Error} Formatted error
 */
const handleXeroError = (error) => {
  logger.error('Xero API Error:', error);

  // Check if it's a Xero API error
  if (error.response && error.response.body) {
    const { body } = error.response;
    
    // Format error message
    let message = 'Xero API Error';
    let code = 'XERO_API_ERROR';
    let statusCode = 500;

    if (body.Status && body.Detail) {
      message = `${body.Status}: ${body.Detail}`;
      code = `XERO_${body.Status.toUpperCase().replace(/\s+/g, '_')}`;
      statusCode = error.response.statusCode || 500;
    }

    return errorResponse(message, code, statusCode);
  }

  // Return original error if not a Xero API error
  return error;
};

module.exports = {
  getXeroClient,
  getTenants,
  selectTenant,
  handleXeroError
};
