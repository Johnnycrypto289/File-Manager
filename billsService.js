/**
 * Xero Bills service for managing bills in Xero
 */

const { getXeroClient, handleXeroError } = require('./xeroClient');
const logger = require('../../utils/logger');

/**
 * Get all bills (purchase invoices) for a tenant
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Query options
 * @returns {Array} List of bills
 */
const getBills = async (userId, tenantId, options = {}) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Set up query parameters
    const where = options.where || 'Type=="ACCPAY"'; // Only get bills (accounts payable)
    const order = options.order || 'Date DESC';
    const page = options.page || 1;
    const pageSize = options.pageSize || 50;
    const statuses = options.statuses || undefined;
    const invoiceNumbers = options.invoiceNumbers || undefined;
    const contactIDs = options.contactIDs || undefined;
    const createdByMyApp = options.createdByMyApp || undefined;

    // Get bills from Xero
    const response = await xero.accountingApi.getInvoices(
      tenant.tenantId,
      undefined,
      undefined,
      where,
      order,
      invoiceNumbers,
      contactIDs,
      statuses,
      page,
      pageSize,
      undefined,
      createdByMyApp
    );

    return response.body.invoices;
  } catch (error) {
    logger.error('Error in getBills:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get a single bill by ID
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} billId - Bill ID
 * @returns {Object} Bill details
 */
const getBill = async (userId, tenantId, billId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get bill from Xero
    const response = await xero.accountingApi.getInvoice(
      tenant.tenantId,
      billId
    );

    const bill = response.body.invoices[0];
    
    // Verify it's a bill
    if (bill.type !== 'ACCPAY') {
      throw new Error('Invoice is not a bill (ACCPAY)');
    }

    return bill;
  } catch (error) {
    logger.error('Error in getBill:', error);
    throw handleXeroError(error);
  }
};

/**
 * Create a new bill
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} billData - Bill data
 * @returns {Object} Created bill
 */
const createBill = async (userId, tenantId, billData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Ensure it's a bill
    billData.type = 'ACCPAY';
    
    // Create bill in Xero
    const response = await xero.accountingApi.createInvoices(
      tenant.tenantId,
      { invoices: [billData] }
    );

    return response.body.invoices[0];
  } catch (error) {
    logger.error('Error in createBill:', error);
    throw handleXeroError(error);
  }
};

/**
 * Update an existing bill
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} billId - Bill ID
 * @param {Object} billData - Bill data
 * @returns {Object} Updated bill
 */
const updateBill = async (userId, tenantId, billId, billData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Ensure billId is included in the data
    billData.invoiceID = billId;
    
    // Ensure it's a bill
    billData.type = 'ACCPAY';
    
    // Update bill in Xero
    const response = await xero.accountingApi.updateInvoice(
      tenant.tenantId,
      billId,
      { invoices: [billData] }
    );

    return response.body.invoices[0];
  } catch (error) {
    logger.error('Error in updateBill:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get bill as PDF
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} billId - Bill ID
 * @returns {Buffer} PDF file buffer
 */
const getBillAsPdf = async (userId, tenantId, billId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get bill as PDF from Xero
    const response = await xero.accountingApi.getInvoiceAsPdf(
      tenant.tenantId,
      billId
    );

    return response.body;
  } catch (error) {
    logger.error('Error in getBillAsPdf:', error);
    throw handleXeroError(error);
  }
};

/**
 * Void a bill
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} billId - Bill ID
 * @returns {Object} Voided bill
 */
const voidBill = async (userId, tenantId, billId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get current bill
    const bill = await getBill(userId, tenantId, billId);
    
    // Update bill status to VOIDED
    bill.status = 'VOIDED';
    
    // Update bill in Xero
    const response = await xero.accountingApi.updateInvoice(
      tenant.tenantId,
      billId,
      { invoices: [bill] }
    );

    return response.body.invoices[0];
  } catch (error) {
    logger.error('Error in voidBill:', error);
    throw handleXeroError(error);
  }
};

module.exports = {
  getBills,
  getBill,
  createBill,
  updateBill,
  getBillAsPdf,
  voidBill
};
