/**
 * Xero Accounts service for managing accounts in Xero
 */

const { getXeroClient, handleXeroError } = require('./xeroClient');
const logger = require('../../utils/logger');

/**
 * Get all accounts for a tenant
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Query options
 * @returns {Array} List of accounts
 */
const getAccounts = async (userId, tenantId, options = {}) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Set up query parameters
    const where = options.where || '';
    const order = options.order || 'Name ASC';

    // Get accounts from Xero
    const response = await xero.accountingApi.getAccounts(
      tenant.tenantId,
      undefined,
      where,
      order
    );

    return response.body.accounts;
  } catch (error) {
    logger.error('Error in getAccounts:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get a single account by ID
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} accountId - Account ID
 * @returns {Object} Account details
 */
const getAccount = async (userId, tenantId, accountId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get account from Xero
    const response = await xero.accountingApi.getAccount(
      tenant.tenantId,
      accountId
    );

    return response.body.accounts[0];
  } catch (error) {
    logger.error('Error in getAccount:', error);
    throw handleXeroError(error);
  }
};

/**
 * Create a new account
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} accountData - Account data
 * @returns {Object} Created account
 */
const createAccount = async (userId, tenantId, accountData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Create account in Xero
    const response = await xero.accountingApi.createAccount(
      tenant.tenantId,
      accountData
    );

    return response.body.accounts[0];
  } catch (error) {
    logger.error('Error in createAccount:', error);
    throw handleXeroError(error);
  }
};

/**
 * Update an existing account
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} accountId - Account ID
 * @param {Object} accountData - Account data
 * @returns {Object} Updated account
 */
const updateAccount = async (userId, tenantId, accountId, accountData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Ensure accountId is included in the data
    accountData.accountID = accountId;
    
    // Update account in Xero
    const response = await xero.accountingApi.updateAccount(
      tenant.tenantId,
      accountId,
      accountData
    );

    return response.body.accounts[0];
  } catch (error) {
    logger.error('Error in updateAccount:', error);
    throw handleXeroError(error);
  }
};

/**
 * Archive an account
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} accountId - Account ID
 * @returns {Object} Archived account
 */
const archiveAccount = async (userId, tenantId, accountId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get current account
    const account = await getAccount(userId, tenantId, accountId);
    
    // Update account status to ARCHIVED
    account.status = 'ARCHIVED';
    
    // Update account in Xero
    const response = await xero.accountingApi.updateAccount(
      tenant.tenantId,
      accountId,
      account
    );

    return response.body.accounts[0];
  } catch (error) {
    logger.error('Error in archiveAccount:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get account types
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @returns {Array} List of account types
 */
const getAccountTypes = async (userId, tenantId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get account types from Xero
    const response = await xero.accountingApi.getAccountTypes(tenant.tenantId);

    return response.body.accountTypes;
  } catch (error) {
    logger.error('Error in getAccountTypes:', error);
    throw handleXeroError(error);
  }
};

module.exports = {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  archiveAccount,
  getAccountTypes
};
