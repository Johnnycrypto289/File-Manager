/**
 * Xero Bank Transactions service for managing bank transactions in Xero
 */

const { getXeroClient, handleXeroError } = require('./xeroClient');
const logger = require('../../utils/logger');

/**
 * Get all bank transactions for a tenant
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Query options
 * @returns {Array} List of bank transactions
 */
const getBankTransactions = async (userId, tenantId, options = {}) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Set up query parameters
    const where = options.where || '';
    const order = options.order || 'Date DESC';
    const page = options.page || 1;
    const pageSize = options.pageSize || 50;
    const bankAccountIDs = options.bankAccountIDs || undefined;
    const isReconciled = options.isReconciled !== undefined ? options.isReconciled : undefined;

    // Get bank transactions from Xero
    const response = await xero.accountingApi.getBankTransactions(
      tenant.tenantId,
      undefined,
      where,
      order,
      page,
      pageSize,
      bankAccountIDs,
      undefined,
      isReconciled
    );

    return response.body.bankTransactions;
  } catch (error) {
    logger.error('Error in getBankTransactions:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get a single bank transaction by ID
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} bankTransactionId - Bank Transaction ID
 * @returns {Object} Bank transaction details
 */
const getBankTransaction = async (userId, tenantId, bankTransactionId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get bank transaction from Xero
    const response = await xero.accountingApi.getBankTransaction(
      tenant.tenantId,
      bankTransactionId
    );

    return response.body.bankTransactions[0];
  } catch (error) {
    logger.error('Error in getBankTransaction:', error);
    throw handleXeroError(error);
  }
};

/**
 * Create a new bank transaction
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} bankTransactionData - Bank transaction data
 * @returns {Object} Created bank transaction
 */
const createBankTransaction = async (userId, tenantId, bankTransactionData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Create bank transaction in Xero
    const response = await xero.accountingApi.createBankTransactions(
      tenant.tenantId,
      { bankTransactions: [bankTransactionData] }
    );

    return response.body.bankTransactions[0];
  } catch (error) {
    logger.error('Error in createBankTransaction:', error);
    throw handleXeroError(error);
  }
};

/**
 * Update an existing bank transaction
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} bankTransactionId - Bank Transaction ID
 * @param {Object} bankTransactionData - Bank transaction data
 * @returns {Object} Updated bank transaction
 */
const updateBankTransaction = async (userId, tenantId, bankTransactionId, bankTransactionData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Ensure bankTransactionId is included in the data
    bankTransactionData.bankTransactionID = bankTransactionId;
    
    // Update bank transaction in Xero
    const response = await xero.accountingApi.updateBankTransaction(
      tenant.tenantId,
      bankTransactionId,
      { bankTransactions: [bankTransactionData] }
    );

    return response.body.bankTransactions[0];
  } catch (error) {
    logger.error('Error in updateBankTransaction:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get bank transaction history
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} bankTransactionId - Bank Transaction ID
 * @returns {Array} Bank transaction history
 */
const getBankTransactionHistory = async (userId, tenantId, bankTransactionId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get bank transaction history from Xero
    const response = await xero.accountingApi.getBankTransactionHistory(
      tenant.tenantId,
      bankTransactionId
    );

    return response.body.historyRecords;
  } catch (error) {
    logger.error('Error in getBankTransactionHistory:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get bank statements for import
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Query options
 * @returns {Array} List of bank statement lines
 */
const getBankStatements = async (userId, tenantId, options = {}) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Set up query parameters
    const bankAccountIDs = options.bankAccountIDs || undefined;
    const page = options.page || 1;
    const pageSize = options.pageSize || 50;
    const dateFrom = options.dateFrom || undefined;
    const dateTo = options.dateTo || undefined;
    const offset = options.offset || undefined;

    // Get bank statements from Xero
    const response = await xero.accountingApi.getBankStatements(
      tenant.tenantId,
      bankAccountIDs,
      page,
      pageSize,
      dateFrom,
      dateTo,
      offset
    );

    return response.body.bankStatements;
  } catch (error) {
    logger.error('Error in getBankStatements:', error);
    throw handleXeroError(error);
  }
};

/**
 * Import bank statement lines
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} statementData - Bank statement data
 * @returns {Object} Import result
 */
const importBankStatement = async (userId, tenantId, statementData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Import bank statement into Xero
    const response = await xero.accountingApi.importStatements(
      tenant.tenantId,
      statementData
    );

    return response.body;
  } catch (error) {
    logger.error('Error in importBankStatement:', error);
    throw handleXeroError(error);
  }
};

module.exports = {
  getBankTransactions,
  getBankTransaction,
  createBankTransaction,
  updateBankTransaction,
  getBankTransactionHistory,
  getBankStatements,
  importBankStatement
};
