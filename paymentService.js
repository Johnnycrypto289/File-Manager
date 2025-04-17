/**
 * Payment Processing Service
 * Handles payment creation, tracking, and reconciliation
 */

const { getPayments, createPayment } = require('../xero/paymentsService');
const { getInvoices } = require('../xero/invoicesService');
const { getBills } = require('../xero/billsService');
const { getBankTransactions } = require('../xero/bankTransactionsService');
const Transaction = require('../../models/Transaction');
const logger = require('../../utils/logger');
const { Op } = require('sequelize');

/**
 * Sync payments from Xero
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for syncing
 * @returns {Array} Newly synced payments
 */
const syncPayments = async (userId, tenantId, options = {}) => {
  try {
    // Get date range for sync
    const days = options.days || 30;
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    // Format dates for Xero API
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];
    
    // Get payments from Xero
    const xeroPayments = await getPayments(userId, tenantId, {
      where: `Date >= DateTime(${fromDateStr}) && Date <= DateTime(${toDateStr})`,
      page: 1,
      pageSize: 100
    });
    
    // Process and store payments
    const newTransactions = [];
    
    for (const xeroPay of xeroPayments) {
      // Check if payment already exists
      const existingTx = await Transaction.findOne({
        where: {
          userId,
          tenantId,
          xeroTransactionId: xeroPay.paymentID,
          type: 'PAYMENT'
        }
      });
      
      if (!existingTx) {
        // Create new transaction record
        const transaction = await Transaction.create({
          userId,
          tenantId,
          xeroTransactionId: xeroPay.paymentID,
          type: 'PAYMENT',
          date: new Date(xeroPay.date),
          amount: xeroPay.amount,
          description: `Payment for ${xeroPay.invoice?.invoiceNumber || xeroPay.reference || 'unknown invoice'}`,
          reference: xeroPay.reference,
          contactId: xeroPay.invoice?.contact?.contactID,
          contactName: xeroPay.invoice?.contact?.name,
          accountId: xeroPay.account?.accountID,
          accountCode: xeroPay.account?.code,
          accountName: xeroPay.account?.name,
          status: 'RECONCILED',
          isReconciled: true,
          reconciliationDate: new Date(),
          metadata: {
            xeroData: xeroPay
          },
          lastSyncedAt: new Date()
        });
        
        newTransactions.push(transaction);
      } else {
        // Update existing transaction
        await existingTx.update({
          amount: xeroPay.amount,
          description: `Payment for ${xeroPay.invoice?.invoiceNumber || xeroPay.reference || 'unknown invoice'}`,
          reference: xeroPay.reference,
          contactId: xeroPay.invoice?.contact?.contactID,
          contactName: xeroPay.invoice?.contact?.name,
          accountId: xeroPay.account?.accountID,
          accountCode: xeroPay.account?.code,
          accountName: xeroPay.account?.name,
          metadata: {
            ...existingTx.metadata,
            xeroData: xeroPay
          },
          lastSyncedAt: new Date()
        });
      }
    }
    
    logger.info(`Synced ${newTransactions.length} new payments for user ${userId}, tenant ${tenantId}`);
    return newTransactions;
  } catch (error) {
    logger.error('Error in syncPayments:', error);
    throw error;
  }
};

/**
 * Create a new payment in Xero
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} paymentData - Payment data
 * @returns {Object} Created payment
 */
const createNewPayment = async (userId, tenantId, paymentData) => {
  try {
    // Validate required fields
    if (!paymentData.invoiceId && !paymentData.bankTransactionId) {
      throw new Error('Either invoiceId or bankTransactionId is required');
    }
    
    if (!paymentData.accountId) {
      throw new Error('Account ID is required');
    }
    
    // Create payment in Xero
    const xeroPayment = await createPayment(userId, tenantId, {
      invoice: paymentData.invoiceId ? {
        invoiceID: paymentData.invoiceId
      } : undefined,
      bankTransaction: paymentData.bankTransactionId ? {
        bankTransactionID: paymentData.bankTransactionId
      } : undefined,
      account: {
        accountID: paymentData.accountId
      },
      date: paymentData.date || new Date().toISOString().split('T')[0],
      amount: paymentData.amount,
      reference: paymentData.reference
    });
    
    // Create transaction record
    const transaction = await Transaction.create({
      userId,
      tenantId,
      xeroTransactionId: xeroPayment.paymentID,
      type: 'PAYMENT',
      date: new Date(xeroPayment.date),
      amount: xeroPayment.amount,
      description: `Payment for ${xeroPayment.invoice?.invoiceNumber || xeroPayment.reference || 'unknown invoice'}`,
      reference: xeroPayment.reference,
      contactId: xeroPayment.invoice?.contact?.contactID,
      contactName: xeroPayment.invoice?.contact?.name,
      accountId: xeroPayment.account?.accountID,
      accountCode: xeroPayment.account?.code,
      accountName: xeroPayment.account?.name,
      status: 'RECONCILED',
      isReconciled: true,
      reconciliationDate: new Date(),
      metadata: {
        xeroData: xeroPayment,
        createdBy: 'CFO_ASSISTANT'
      },
      lastSyncedAt: new Date()
    });
    
    logger.info(`Created new payment ${xeroPayment.paymentID} for user ${userId}, tenant ${tenantId}`);
    return {
      transaction,
      xeroPayment
    };
  } catch (error) {
    logger.error('Error in createNewPayment:', error);
    throw error;
  }
};

/**
 * Get upcoming bill payments
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for filtering
 * @returns {Array} Upcoming bill payments
 */
const getUpcomingBillPayments = async (userId, tenantId, options = {}) => {
  try {
    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate date range
    const daysAhead = options.daysAhead || 14;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysAhead);
    
    // Get upcoming bills from Xero
    const xeroBills = await getBills(userId, tenantId, {
      where: `Status=="AUTHORISED" && DueDate >= DateTime(${today.toISOString().split('T')[0]}) && DueDate <= DateTime(${endDate.toISOString().split('T')[0]})`,
      page: options.page || 1,
      pageSize: options.pageSize || 50
    });
    
    // Group by due date
    const byDueDate = {};
    
    for (const bill of xeroBills) {
      const dueDate = bill.dueDate.split('T')[0];
      
      if (!byDueDate[dueDate]) {
        byDueDate[dueDate] = {
          date: dueDate,
          bills: [],
          total: 0
        };
      }
      
      byDueDate[dueDate].bills.push(bill);
      byDueDate[dueDate].total += bill.amountDue;
    }
    
    // Convert to array and sort by date
    const result = Object.values(byDueDate).sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    return {
      total: xeroBills.length,
      totalAmount: xeroBills.reduce((sum, bill) => sum + bill.amountDue, 0),
      byDueDate: result
    };
  } catch (error) {
    logger.error('Error in getUpcomingBillPayments:', error);
    throw error;
  }
};

/**
 * Generate payment schedule for bills
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for scheduling
 * @returns {Object} Payment schedule
 */
const generatePaymentSchedule = async (userId, tenantId, options = {}) => {
  try {
    // Get upcoming bills
    const upcomingBills = await getUpcomingBillPayments(userId, tenantId, {
      daysAhead: options.daysAhead || 30
    });
    
    // Get bank account balances
    const bankAccounts = await getBankTransactions(userId, tenantId, {
      page: 1,
      pageSize: 1
    });
    
    // This is a simplified approach - in a real implementation,
    // we would need to get actual bank account balances and
    // forecast cash flow based on expected income and expenses
    
    // For now, we'll just create a simple schedule based on due dates
    const schedule = [];
    
    for (const dateGroup of upcomingBills.byDueDate) {
      // Create a payment batch for each due date
      const batch = {
        paymentDate: dateGroup.date,
        totalAmount: dateGroup.total,
        bills: dateGroup.bills.map(bill => ({
          billId: bill.invoiceID,
          billNumber: bill.invoiceNumber,
          contactName: bill.contact.name,
          amount: bill.amountDue,
          dueDate: bill.dueDate
        }))
      };
      
      schedule.push(batch);
    }
    
    return {
      totalBills: upcomingBills.total,
      totalAmount: upcomingBills.totalAmount,
      paymentBatches: schedule
    };
  } catch (error) {
    logger.error('Error in generatePaymentSchedule:', error);
    throw error;
  }
};

/**
 * Process batch payment for bills
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Array} billIds - Array of bill IDs to pay
 * @param {string} accountId - Bank account ID to pay from
 * @returns {Array} Created payments
 */
const processBatchPayment = async (userId, tenantId, billIds, accountId) => {
  try {
    // Validate input
    if (!Array.isArray(billIds) || billIds.length === 0) {
      throw new Error('At least one bill ID is required');
    }
    
    if (!accountId) {
      throw new Error('Bank account ID is required');
    }
    
    // Get bills to pay
    const bills = await Promise.all(
      billIds.map(id => getBills(userId, tenantId, {
        where: `InvoiceID=guid("${id}")`,
        page: 1,
        pageSize: 1
      }))
    );
    
    // Flatten and filter valid bills
    const validBills = bills
      .flat()
      .filter(bill => bill && bill.status === 'AUTHORISED' && bill.amountDue > 0);
    
    if (validBills.length === 0) {
      throw new Error('No valid bills found for payment');
    }
    
    // Create payments for each bill
    const payments = [];
    
    for (const bill of validBills) {
      const payment = await createNewPayment(userId, tenantId, {
        invoiceId: bill.invoiceID,
        accountId: accountId,
        amount: bill.amountDue,
        date: new Date().toISOString().split('T')[0],
        reference: `Payment for ${bill.invoiceNumber}`
      });
      
      payments.push(payment);
    }
    
    logger.info(`Processed batch payment for ${payments.length} bills for user ${userId}, tenant ${tenantId}`);
    return payments;
  } catch (error) {
    logger.error('Error in processBatchPayment:', error);
    throw error;
  }
};

module.exports = {
  syncPayments,
  createNewPayment,
  getUpcomingBillPayments,
  generatePaymentSchedule,
  processBatchPayment
};
