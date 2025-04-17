/**
 * Xero Invoices service for managing invoices in Xero
 */

const { getXeroClient, handleXeroError } = require('./xeroClient');
const logger = require('../../utils/logger');

/**
 * Get all invoices for a tenant
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Query options
 * @returns {Array} List of invoices
 */
const getInvoices = async (userId, tenantId, options = {}) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Set up query parameters
    const where = options.where || '';
    const order = options.order || 'Date DESC';
    const page = options.page || 1;
    const pageSize = options.pageSize || 50;
    const statuses = options.statuses || undefined;
    const invoiceNumbers = options.invoiceNumbers || undefined;
    const contactIDs = options.contactIDs || undefined;
    const createdByMyApp = options.createdByMyApp || undefined;

    // Get invoices from Xero
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
    logger.error('Error in getInvoices:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get a single invoice by ID
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} invoiceId - Invoice ID
 * @returns {Object} Invoice details
 */
const getInvoice = async (userId, tenantId, invoiceId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get invoice from Xero
    const response = await xero.accountingApi.getInvoice(
      tenant.tenantId,
      invoiceId
    );

    return response.body.invoices[0];
  } catch (error) {
    logger.error('Error in getInvoice:', error);
    throw handleXeroError(error);
  }
};

/**
 * Create a new invoice
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} invoiceData - Invoice data
 * @returns {Object} Created invoice
 */
const createInvoice = async (userId, tenantId, invoiceData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Create invoice in Xero
    const response = await xero.accountingApi.createInvoices(
      tenant.tenantId,
      { invoices: [invoiceData] }
    );

    return response.body.invoices[0];
  } catch (error) {
    logger.error('Error in createInvoice:', error);
    throw handleXeroError(error);
  }
};

/**
 * Update an existing invoice
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} invoiceId - Invoice ID
 * @param {Object} invoiceData - Invoice data
 * @returns {Object} Updated invoice
 */
const updateInvoice = async (userId, tenantId, invoiceId, invoiceData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Ensure invoiceId is included in the data
    invoiceData.invoiceID = invoiceId;
    
    // Update invoice in Xero
    const response = await xero.accountingApi.updateInvoice(
      tenant.tenantId,
      invoiceId,
      { invoices: [invoiceData] }
    );

    return response.body.invoices[0];
  } catch (error) {
    logger.error('Error in updateInvoice:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get invoice as PDF
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} invoiceId - Invoice ID
 * @returns {Buffer} PDF file buffer
 */
const getInvoiceAsPdf = async (userId, tenantId, invoiceId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get invoice as PDF from Xero
    const response = await xero.accountingApi.getInvoiceAsPdf(
      tenant.tenantId,
      invoiceId
    );

    return response.body;
  } catch (error) {
    logger.error('Error in getInvoiceAsPdf:', error);
    throw handleXeroError(error);
  }
};

/**
 * Email invoice
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} invoiceId - Invoice ID
 * @param {Object} emailData - Email data
 * @returns {Object} Result of email operation
 */
const emailInvoice = async (userId, tenantId, invoiceId, emailData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Email invoice from Xero
    const response = await xero.accountingApi.emailInvoice(
      tenant.tenantId,
      invoiceId,
      emailData
    );

    return { success: true, message: 'Invoice emailed successfully' };
  } catch (error) {
    logger.error('Error in emailInvoice:', error);
    throw handleXeroError(error);
  }
};

/**
 * Void an invoice
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} invoiceId - Invoice ID
 * @returns {Object} Voided invoice
 */
const voidInvoice = async (userId, tenantId, invoiceId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get current invoice
    const invoice = await getInvoice(userId, tenantId, invoiceId);
    
    // Update invoice status to VOIDED
    invoice.status = 'VOIDED';
    
    // Update invoice in Xero
    const response = await xero.accountingApi.updateInvoice(
      tenant.tenantId,
      invoiceId,
      { invoices: [invoice] }
    );

    return response.body.invoices[0];
  } catch (error) {
    logger.error('Error in voidInvoice:', error);
    throw handleXeroError(error);
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  getInvoiceAsPdf,
  emailInvoice,
  voidInvoice
};
