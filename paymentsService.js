/**
 * Xero Payments service for managing payments in Xero
 */

const { getXeroClient, handleXeroError } = require('./xeroClient');
const logger = require('../../utils/logger');

/**
 * Get all payments for a tenant
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Query options
 * @returns {Array} List of payments
 */
const getPayments = async (userId, tenantId, options = {}) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Set up query parameters
    const where = options.where || '';
    const order = options.order || 'Date DESC';
    const page = options.page || 1;
    const pageSize = options.pageSize || 50;
    const paymentIDs = options.paymentIDs || undefined;

    // Get payments from Xero
    const response = await xero.accountingApi.getPayments(
      tenant.tenantId,
      undefined,
      where,
      order,
      page,
      pageSize,
      paymentIDs
    );

    return response.body.payments;
  } catch (error) {
    logger.error('Error in getPayments:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get a single payment by ID
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} paymentId - Payment ID
 * @returns {Object} Payment details
 */
const getPayment = async (userId, tenantId, paymentId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get payment from Xero
    const response = await xero.accountingApi.getPayment(
      tenant.tenantId,
      paymentId
    );

    return response.body.payments[0];
  } catch (error) {
    logger.error('Error in getPayment:', error);
    throw handleXeroError(error);
  }
};

/**
 * Create a new payment
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} paymentData - Payment data
 * @returns {Object} Created payment
 */
const createPayment = async (userId, tenantId, paymentData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Create payment in Xero
    const response = await xero.accountingApi.createPayment(
      tenant.tenantId,
      paymentData
    );

    return response.body.payments[0];
  } catch (error) {
    logger.error('Error in createPayment:', error);
    throw handleXeroError(error);
  }
};

/**
 * Update an existing payment
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} paymentId - Payment ID
 * @param {Object} paymentData - Payment data
 * @returns {Object} Updated payment
 */
const updatePayment = async (userId, tenantId, paymentId, paymentData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Ensure paymentId is included in the data
    paymentData.paymentID = paymentId;
    
    // Update payment in Xero
    const response = await xero.accountingApi.updatePayment(
      tenant.tenantId,
      paymentId,
      paymentData
    );

    return response.body.payments[0];
  } catch (error) {
    logger.error('Error in updatePayment:', error);
    throw handleXeroError(error);
  }
};

/**
 * Delete a payment
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} paymentId - Payment ID
 * @returns {Object} Result of delete operation
 */
const deletePayment = async (userId, tenantId, paymentId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Delete payment in Xero
    const response = await xero.accountingApi.deletePayment(
      tenant.tenantId,
      paymentId
    );

    return { success: true, message: 'Payment deleted successfully' };
  } catch (error) {
    logger.error('Error in deletePayment:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get payment history
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} paymentId - Payment ID
 * @returns {Array} Payment history
 */
const getPaymentHistory = async (userId, tenantId, paymentId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get payment history from Xero
    const response = await xero.accountingApi.getPaymentHistory(
      tenant.tenantId,
      paymentId
    );

    return response.body.historyRecords;
  } catch (error) {
    logger.error('Error in getPaymentHistory:', error);
    throw handleXeroError(error);
  }
};

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentHistory
};
