/**
 * Xero Contacts service for managing contacts in Xero
 */

const { getXeroClient, handleXeroError } = require('./xeroClient');
const logger = require('../../utils/logger');

/**
 * Get all contacts for a tenant
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Query options
 * @returns {Array} List of contacts
 */
const getContacts = async (userId, tenantId, options = {}) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Set up query parameters
    const where = options.where || '';
    const order = options.order || 'Name ASC';
    const page = options.page || 1;
    const pageSize = options.pageSize || 100;

    // Get contacts from Xero
    const response = await xero.accountingApi.getContacts(
      tenant.tenantId,
      undefined,
      where,
      order,
      page,
      pageSize
    );

    return response.body.contacts;
  } catch (error) {
    logger.error('Error in getContacts:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get a single contact by ID
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} contactId - Contact ID
 * @returns {Object} Contact details
 */
const getContact = async (userId, tenantId, contactId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get contact from Xero
    const response = await xero.accountingApi.getContact(
      tenant.tenantId,
      contactId
    );

    return response.body.contacts[0];
  } catch (error) {
    logger.error('Error in getContact:', error);
    throw handleXeroError(error);
  }
};

/**
 * Create a new contact
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} contactData - Contact data
 * @returns {Object} Created contact
 */
const createContact = async (userId, tenantId, contactData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Create contact in Xero
    const response = await xero.accountingApi.createContacts(
      tenant.tenantId,
      { contacts: [contactData] }
    );

    return response.body.contacts[0];
  } catch (error) {
    logger.error('Error in createContact:', error);
    throw handleXeroError(error);
  }
};

/**
 * Update an existing contact
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} contactId - Contact ID
 * @param {Object} contactData - Contact data
 * @returns {Object} Updated contact
 */
const updateContact = async (userId, tenantId, contactId, contactData) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Ensure contactId is included in the data
    contactData.contactID = contactId;
    
    // Update contact in Xero
    const response = await xero.accountingApi.updateContact(
      tenant.tenantId,
      contactId,
      { contacts: [contactData] }
    );

    return response.body.contacts[0];
  } catch (error) {
    logger.error('Error in updateContact:', error);
    throw handleXeroError(error);
  }
};

/**
 * Archive a contact
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} contactId - Contact ID
 * @returns {Object} Archived contact
 */
const archiveContact = async (userId, tenantId, contactId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get current contact
    const contact = await getContact(userId, tenantId, contactId);
    
    // Update contact status to ARCHIVED
    contact.contactStatus = 'ARCHIVED';
    
    // Update contact in Xero
    const response = await xero.accountingApi.updateContact(
      tenant.tenantId,
      contactId,
      { contacts: [contact] }
    );

    return response.body.contacts[0];
  } catch (error) {
    logger.error('Error in archiveContact:', error);
    throw handleXeroError(error);
  }
};

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  archiveContact
};
