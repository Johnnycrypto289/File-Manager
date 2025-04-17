/**
 * Bank Reconciliation Service
 * Handles matching bank transactions with invoices and bills
 */

const Transaction = require('../../models/Transaction');
const { getBankTransactions } = require('../xero/bankTransactionsService');
const { getInvoices } = require('../xero/invoicesService');
const { getBills } = require('../xero/billsService');
const logger = require('../../utils/logger');

/**
 * Fetch and store recent bank transactions from Xero
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for fetching transactions
 * @returns {Array} Newly synced transactions
 */
const syncBankTransactions = async (userId, tenantId, options = {}) => {
  try {
    // Get date range for sync
    const days = options.days || 30;
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    // Format dates for Xero API
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];
    
    // Get transactions from Xero
    const xeroTransactions = await getBankTransactions(userId, tenantId, {
      where: `Date >= DateTime(${fromDateStr}) && Date <= DateTime(${toDateStr})`,
      page: 1,
      pageSize: 100
    });
    
    // Process and store transactions
    const newTransactions = [];
    
    for (const xeroTx of xeroTransactions) {
      // Check if transaction already exists
      const existingTx = await Transaction.findOne({
        where: {
          userId,
          tenantId,
          xeroTransactionId: xeroTx.bankTransactionID
        }
      });
      
      if (!existingTx) {
        // Create new transaction record
        const transaction = await Transaction.create({
          userId,
          tenantId,
          xeroTransactionId: xeroTx.bankTransactionID,
          type: 'BANK',
          date: new Date(xeroTx.date),
          amount: xeroTx.total,
          description: xeroTx.reference || xeroTx.subTitle,
          reference: xeroTx.reference,
          contactId: xeroTx.contact?.contactID,
          contactName: xeroTx.contact?.name,
          accountId: xeroTx.bankAccount?.accountID,
          accountCode: xeroTx.bankAccount?.code,
          accountName: xeroTx.bankAccount?.name,
          status: xeroTx.isReconciled ? 'RECONCILED' : 'PENDING',
          isReconciled: xeroTx.isReconciled,
          reconciliationDate: xeroTx.isReconciled ? new Date() : null,
          metadata: {
            xeroData: xeroTx
          },
          lastSyncedAt: new Date()
        });
        
        newTransactions.push(transaction);
      } else {
        // Update existing transaction
        await existingTx.update({
          amount: xeroTx.total,
          description: xeroTx.reference || xeroTx.subTitle,
          reference: xeroTx.reference,
          contactId: xeroTx.contact?.contactID,
          contactName: xeroTx.contact?.name,
          status: xeroTx.isReconciled ? 'RECONCILED' : existingTx.status,
          isReconciled: xeroTx.isReconciled,
          reconciliationDate: xeroTx.isReconciled && !existingTx.isReconciled ? new Date() : existingTx.reconciliationDate,
          metadata: {
            ...existingTx.metadata,
            xeroData: xeroTx
          },
          lastSyncedAt: new Date()
        });
      }
    }
    
    logger.info(`Synced ${newTransactions.length} new bank transactions for user ${userId}, tenant ${tenantId}`);
    return newTransactions;
  } catch (error) {
    logger.error('Error in syncBankTransactions:', error);
    throw error;
  }
};

/**
 * Find potential matches for a bank transaction
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} transactionId - Transaction ID
 * @returns {Object} Potential matches
 */
const findPotentialMatches = async (userId, tenantId, transactionId) => {
  try {
    // Get transaction details
    const transaction = await Transaction.findOne({
      where: {
        id: transactionId,
        userId,
        tenantId
      }
    });
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // Skip if already reconciled
    if (transaction.isReconciled) {
      return {
        transaction,
        invoices: [],
        bills: []
      };
    }
    
    // Determine if it's a payment or receipt
    const isPayment = transaction.amount < 0;
    const absAmount = Math.abs(transaction.amount);
    
    // Set up search criteria
    const amountTolerance = 0.01; // 1 cent tolerance for floating point issues
    const minAmount = absAmount - amountTolerance;
    const maxAmount = absAmount + amountTolerance;
    
    // Search for matching documents
    let matches = [];
    
    if (isPayment) {
      // For payments (negative amounts), look for bills
      const bills = await getBills(userId, tenantId, {
        where: `Status=="AUTHORISED" && AmountDue >= ${minAmount} && AmountDue <= ${maxAmount}`,
        page: 1,
        pageSize: 20
      });
      
      matches = {
        transaction,
        invoices: [],
        bills: bills.map(bill => ({
          id: bill.invoiceID,
          type: 'BILL',
          number: bill.invoiceNumber,
          reference: bill.reference,
          date: bill.date,
          dueDate: bill.dueDate,
          contact: bill.contact?.name,
          amount: bill.total,
          amountDue: bill.amountDue,
          confidence: calculateMatchConfidence(transaction, bill)
        }))
      };
    } else {
      // For receipts (positive amounts), look for invoices
      const invoices = await getInvoices(userId, tenantId, {
        where: `Status=="AUTHORISED" && AmountDue >= ${minAmount} && AmountDue <= ${maxAmount}`,
        page: 1,
        pageSize: 20
      });
      
      matches = {
        transaction,
        invoices: invoices.map(invoice => ({
          id: invoice.invoiceID,
          type: 'INVOICE',
          number: invoice.invoiceNumber,
          reference: invoice.reference,
          date: invoice.date,
          dueDate: invoice.dueDate,
          contact: invoice.contact?.name,
          amount: invoice.total,
          amountDue: invoice.amountDue,
          confidence: calculateMatchConfidence(transaction, invoice)
        })),
        bills: []
      };
    }
    
    // Sort matches by confidence
    matches.invoices.sort((a, b) => b.confidence - a.confidence);
    matches.bills.sort((a, b) => b.confidence - a.confidence);
    
    return matches;
  } catch (error) {
    logger.error('Error in findPotentialMatches:', error);
    throw error;
  }
};

/**
 * Calculate match confidence score
 * @param {Object} transaction - Bank transaction
 * @param {Object} document - Invoice or bill
 * @returns {number} Confidence score (0-100)
 */
const calculateMatchConfidence = (transaction, document) => {
  let score = 0;
  
  // Exact amount match (most important)
  const txAmount = Math.abs(transaction.amount);
  const docAmount = document.amountDue || document.total;
  if (Math.abs(txAmount - docAmount) < 0.01) {
    score += 50;
  }
  
  // Contact name match
  if (transaction.contactName && 
      document.contact && 
      transaction.contactName.toLowerCase() === document.contact.name.toLowerCase()) {
    score += 20;
  }
  
  // Reference number match
  if (transaction.reference && 
      document.reference && 
      transaction.reference.includes(document.reference)) {
    score += 15;
  }
  
  // Invoice number in description
  if (transaction.description && 
      document.invoiceNumber && 
      transaction.description.includes(document.invoiceNumber)) {
    score += 15;
  }
  
  // Date proximity (within 7 days)
  const txDate = new Date(transaction.date);
  const docDate = new Date(document.date);
  const daysDiff = Math.abs((txDate - docDate) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 7) {
    score += 10 - daysDiff; // More points for closer dates
  }
  
  return Math.min(score, 100); // Cap at 100
};

/**
 * Reconcile a bank transaction with an invoice or bill
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} transactionId - Transaction ID
 * @param {string} documentId - Invoice or bill ID
 * @param {string} documentType - Document type (INVOICE or BILL)
 * @returns {Object} Reconciled transaction
 */
const reconcileTransaction = async (userId, tenantId, transactionId, documentId, documentType) => {
  try {
    // Get transaction
    const transaction = await Transaction.findOne({
      where: {
        id: transactionId,
        userId,
        tenantId
      }
    });
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    if (transaction.isReconciled) {
      throw new Error('Transaction is already reconciled');
    }
    
    // Update transaction
    await transaction.update({
      status: 'RECONCILED',
      isReconciled: true,
      reconciliationDate: new Date(),
      metadata: {
        ...transaction.metadata,
        reconciliation: {
          documentId,
          documentType,
          reconciliationDate: new Date()
        }
      }
    });
    
    // TODO: Create payment in Xero if needed
    // This would involve calling the Xero API to create a payment
    // linking the invoice/bill to the bank transaction
    
    logger.info(`Reconciled transaction ${transactionId} with ${documentType} ${documentId}`);
    
    return transaction;
  } catch (error) {
    logger.error('Error in reconcileTransaction:', error);
    throw error;
  }
};

/**
 * Get reconciliation statistics
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for statistics
 * @returns {Object} Reconciliation statistics
 */
const getReconciliationStats = async (userId, tenantId, options = {}) => {
  try {
    // Get date range
    const days = options.days || 30;
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    // Count total transactions
    const totalCount = await Transaction.count({
      where: {
        userId,
        tenantId,
        type: 'BANK',
        date: {
          [Op.between]: [fromDate, toDate]
        }
      }
    });
    
    // Count reconciled transactions
    const reconciledCount = await Transaction.count({
      where: {
        userId,
        tenantId,
        type: 'BANK',
        isReconciled: true,
        date: {
          [Op.between]: [fromDate, toDate]
        }
      }
    });
    
    // Calculate percentage
    const reconciledPercentage = totalCount > 0 
      ? Math.round((reconciledCount / totalCount) * 100) 
      : 0;
    
    return {
      totalTransactions: totalCount,
      reconciledTransactions: reconciledCount,
      pendingTransactions: totalCount - reconciledCount,
      reconciledPercentage,
      period: {
        fromDate,
        toDate,
        days
      }
    };
  } catch (error) {
    logger.error('Error in getReconciliationStats:', error);
    throw error;
  }
};

module.exports = {
  syncBankTransactions,
  findPotentialMatches,
  reconcileTransaction,
  getReconciliationStats
};
