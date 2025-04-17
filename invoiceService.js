/**
 * Invoice Automation Service
 * Handles invoice creation, sending, and tracking
 */

const { getInvoices, createInvoice, updateInvoice, emailInvoice } = require('../xero/invoicesService');
const { getContacts } = require('../xero/contactsService');
const Transaction = require('../../models/Transaction');
const logger = require('../../utils/logger');
const { Op } = require('sequelize');

/**
 * Sync invoices from Xero
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for syncing
 * @returns {Array} Newly synced invoices
 */
const syncInvoices = async (userId, tenantId, options = {}) => {
  try {
    // Get date range for sync
    const days = options.days || 30;
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    // Format dates for Xero API
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];
    
    // Get invoices from Xero
    const xeroInvoices = await getInvoices(userId, tenantId, {
      where: `Date >= DateTime(${fromDateStr}) && Date <= DateTime(${toDateStr}) && Type=="ACCREC"`,
      page: 1,
      pageSize: 100
    });
    
    // Process and store invoices
    const newTransactions = [];
    
    for (const xeroInv of xeroInvoices) {
      // Check if invoice already exists
      const existingTx = await Transaction.findOne({
        where: {
          userId,
          tenantId,
          xeroTransactionId: xeroInv.invoiceID,
          type: 'INVOICE'
        }
      });
      
      if (!existingTx) {
        // Create new transaction record
        const transaction = await Transaction.create({
          userId,
          tenantId,
          xeroTransactionId: xeroInv.invoiceID,
          type: 'INVOICE',
          date: new Date(xeroInv.date),
          amount: xeroInv.total,
          description: xeroInv.reference || `Invoice #${xeroInv.invoiceNumber}`,
          reference: xeroInv.invoiceNumber,
          contactId: xeroInv.contact?.contactID,
          contactName: xeroInv.contact?.name,
          status: mapInvoiceStatus(xeroInv.status),
          isReconciled: xeroInv.status === 'PAID',
          reconciliationDate: xeroInv.status === 'PAID' ? new Date() : null,
          metadata: {
            xeroData: xeroInv
          },
          lastSyncedAt: new Date()
        });
        
        newTransactions.push(transaction);
      } else {
        // Update existing transaction
        await existingTx.update({
          amount: xeroInv.total,
          description: xeroInv.reference || `Invoice #${xeroInv.invoiceNumber}`,
          reference: xeroInv.invoiceNumber,
          contactId: xeroInv.contact?.contactID,
          contactName: xeroInv.contact?.name,
          status: mapInvoiceStatus(xeroInv.status),
          isReconciled: xeroInv.status === 'PAID',
          reconciliationDate: xeroInv.status === 'PAID' && !existingTx.isReconciled ? new Date() : existingTx.reconciliationDate,
          metadata: {
            ...existingTx.metadata,
            xeroData: xeroInv
          },
          lastSyncedAt: new Date()
        });
      }
    }
    
    logger.info(`Synced ${newTransactions.length} new invoices for user ${userId}, tenant ${tenantId}`);
    return newTransactions;
  } catch (error) {
    logger.error('Error in syncInvoices:', error);
    throw error;
  }
};

/**
 * Map Xero invoice status to internal status
 * @param {string} xeroStatus - Xero invoice status
 * @returns {string} Internal status
 */
const mapInvoiceStatus = (xeroStatus) => {
  switch (xeroStatus) {
    case 'DRAFT':
      return 'PENDING';
    case 'SUBMITTED':
    case 'AUTHORISED':
      return 'CATEGORIZED';
    case 'PAID':
      return 'RECONCILED';
    case 'VOIDED':
    case 'DELETED':
      return 'VOIDED';
    default:
      return 'PENDING';
  }
};

/**
 * Create a new invoice in Xero
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} invoiceData - Invoice data
 * @returns {Object} Created invoice
 */
const createNewInvoice = async (userId, tenantId, invoiceData) => {
  try {
    // Create invoice in Xero
    const xeroInvoice = await createInvoice(userId, tenantId, {
      type: 'ACCREC', // Accounts receivable
      contact: {
        contactID: invoiceData.contactId
      },
      date: invoiceData.date || new Date().toISOString().split('T')[0],
      dueDate: invoiceData.dueDate,
      lineItems: invoiceData.lineItems,
      reference: invoiceData.reference,
      status: invoiceData.status || 'DRAFT'
    });
    
    // Create transaction record
    const transaction = await Transaction.create({
      userId,
      tenantId,
      xeroTransactionId: xeroInvoice.invoiceID,
      type: 'INVOICE',
      date: new Date(xeroInvoice.date),
      amount: xeroInvoice.total,
      description: xeroInvoice.reference || `Invoice #${xeroInvoice.invoiceNumber}`,
      reference: xeroInvoice.invoiceNumber,
      contactId: xeroInvoice.contact?.contactID,
      contactName: xeroInvoice.contact?.name,
      status: mapInvoiceStatus(xeroInvoice.status),
      isReconciled: false,
      metadata: {
        xeroData: xeroInvoice,
        createdBy: 'CFO_ASSISTANT'
      },
      lastSyncedAt: new Date()
    });
    
    logger.info(`Created new invoice ${xeroInvoice.invoiceID} for user ${userId}, tenant ${tenantId}`);
    return {
      transaction,
      xeroInvoice
    };
  } catch (error) {
    logger.error('Error in createNewInvoice:', error);
    throw error;
  }
};

/**
 * Send invoice to customer
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} invoiceId - Invoice ID
 * @param {Object} emailOptions - Email options
 * @returns {Object} Email result
 */
const sendInvoice = async (userId, tenantId, invoiceId, emailOptions = {}) => {
  try {
    // Get transaction
    const transaction = await Transaction.findOne({
      where: {
        userId,
        tenantId,
        xeroTransactionId: invoiceId,
        type: 'INVOICE'
      }
    });
    
    if (!transaction) {
      throw new Error('Invoice not found');
    }
    
    // Send email via Xero
    const result = await emailInvoice(userId, tenantId, invoiceId, {
      emailAddress: emailOptions.emailAddress,
      subject: emailOptions.subject || `Invoice ${transaction.reference}`,
      message: emailOptions.message || `Please find attached invoice ${transaction.reference}.`
    });
    
    // Update transaction
    await transaction.update({
      metadata: {
        ...transaction.metadata,
        emailSent: {
          date: new Date(),
          to: emailOptions.emailAddress,
          subject: emailOptions.subject,
          message: emailOptions.message
        }
      }
    });
    
    logger.info(`Sent invoice ${invoiceId} to ${emailOptions.emailAddress}`);
    return result;
  } catch (error) {
    logger.error('Error in sendInvoice:', error);
    throw error;
  }
};

/**
 * Get overdue invoices
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for filtering
 * @returns {Array} Overdue invoices
 */
const getOverdueInvoices = async (userId, tenantId, options = {}) => {
  try {
    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get overdue invoices from Xero
    const xeroInvoices = await getInvoices(userId, tenantId, {
      where: `Status=="AUTHORISED" && DueDate < DateTime(${today.toISOString().split('T')[0]}) && Type=="ACCREC"`,
      page: options.page || 1,
      pageSize: options.pageSize || 50
    });
    
    // Group by contact
    const byContact = {};
    
    for (const invoice of xeroInvoices) {
      const contactId = invoice.contact.contactID;
      
      if (!byContact[contactId]) {
        byContact[contactId] = {
          contact: invoice.contact,
          invoices: [],
          total: 0
        };
      }
      
      byContact[contactId].invoices.push(invoice);
      byContact[contactId].total += invoice.amountDue;
    }
    
    return {
      total: xeroInvoices.length,
      totalAmount: xeroInvoices.reduce((sum, inv) => sum + inv.amountDue, 0),
      byContact: Object.values(byContact)
    };
  } catch (error) {
    logger.error('Error in getOverdueInvoices:', error);
    throw error;
  }
};

/**
 * Generate payment reminder for overdue invoices
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} contactId - Contact ID
 * @returns {Object} Reminder data
 */
const generatePaymentReminder = async (userId, tenantId, contactId) => {
  try {
    // Get contact details
    const contacts = await getContacts(userId, tenantId, {
      where: `ContactID=guid("${contactId}")`
    });
    
    if (!contacts || contacts.length === 0) {
      throw new Error('Contact not found');
    }
    
    const contact = contacts[0];
    
    // Get overdue invoices for contact
    const xeroInvoices = await getInvoices(userId, tenantId, {
      where: `Status=="AUTHORISED" && Contact.ContactID=guid("${contactId}") && Type=="ACCREC"`,
      order: 'DueDate'
    });
    
    // Filter to only overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueInvoices = xeroInvoices.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      return dueDate < today;
    });
    
    if (overdueInvoices.length === 0) {
      throw new Error('No overdue invoices found for contact');
    }
    
    // Generate reminder text
    const totalAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
    const oldestInvoice = overdueInvoices[0];
    const oldestDueDate = new Date(oldestInvoice.dueDate);
    const daysPastDue = Math.floor((today - oldestDueDate) / (1000 * 60 * 60 * 24));
    
    // Determine reminder level
    let reminderLevel = 'GENTLE';
    if (daysPastDue > 30) {
      reminderLevel = 'FIRM';
    }
    if (daysPastDue > 60) {
      reminderLevel = 'URGENT';
    }
    
    // Generate subject and message
    let subject, message;
    
    switch (reminderLevel) {
      case 'GENTLE':
        subject = `Friendly reminder: ${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''}`;
        message = `Dear ${contact.name},\n\nThis is a friendly reminder that you have ${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} with a total amount of ${totalAmount.toFixed(2)}.\n\nPlease arrange payment at your earliest convenience.\n\nIf you have already made payment, please disregard this reminder.\n\nThank you for your business.\n\nBest regards,\nAccounts Receivable Team`;
        break;
      case 'FIRM':
        subject = `Overdue payment reminder: ${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} past due`;
        message = `Dear ${contact.name},\n\nWe notice that you have ${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} that ${overdueInvoices.length > 1 ? 'are' : 'is'} now more than 30 days overdue, with a total amount of ${totalAmount.toFixed(2)}.\n\nPlease arrange payment as soon as possible or contact us to discuss payment arrangements.\n\nIf you have already made payment, please let us know so we can update our records.\n\nThank you for your prompt attention to this matter.\n\nBest regards,\nAccounts Receivable Team`;
        break;
      case 'URGENT':
        subject = `URGENT: ${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} significantly overdue`;
        message = `Dear ${contact.name},\n\nWe are concerned that you have ${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} that ${overdueInvoices.length > 1 ? 'are' : 'is'} now more than 60 days overdue, with a total amount of ${totalAmount.toFixed(2)}.\n\nImmediate payment is required to avoid further action. If you are experiencing financial difficulties, please contact us immediately to discuss payment options.\n\nIf you have already made payment, please provide payment details so we can update our records.\n\nThank you for your immediate attention to this matter.\n\nBest regards,\nAccounts Receivable Team`;
        break;
    }
    
    return {
      contact,
      overdueInvoices,
      totalAmount,
      daysPastDue,
      reminderLevel,
      subject,
      message,
      emailAddress: contact.emailAddress
    };
  } catch (error) {
    logger.error('Error in generatePaymentReminder:', error);
    throw error;
  }
};

/**
 * Send payment reminder email
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} contactId - Contact ID
 * @param {Object} options - Email options
 * @returns {Object} Email result
 */
const sendPaymentReminder = async (userId, tenantId, contactId, options = {}) => {
  try {
    // Generate reminder
    const reminder = await generatePaymentReminder(userId, tenantId, contactId);
    
    // Override email options if provided
    const emailOptions = {
      emailAddress: options.emailAddress || reminder.emailAddress,
      subject: options.subject || reminder.subject,
      message: options.message || reminder.message
    };
    
    // Send email for each invoice
    const results = [];
    
    for (const invoice of reminder.overdueInvoices) {
      const result = await sendInvoice(userId, tenantId, invoice.invoiceID, emailOptions);
      results.push({
        invoiceId: invoice.invoiceID,
        invoiceNumber: invoice.invoiceNumber,
        result
      });
    }
    
    logger.info(`Sent payment reminder to ${contactId} for ${reminder.overdueInvoices.length} invoices`);
    
    return {
      reminder,
      results
    };
  } catch (error) {
    logger.error('Error in sendPaymentReminder:', error);
    throw error;
  }
};

module.exports = {
  syncInvoices,
  createNewInvoice,
  sendInvoice,
  getOverdueInvoices,
  generatePaymentReminder,
  sendPaymentReminder
};
