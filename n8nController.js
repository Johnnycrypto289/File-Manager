/**
 * n8n API Controller
 * Handles API endpoints specifically designed for n8n integration
 */

const { calculateKPIs } = require('../../services/analysis/kpiService');
const { generateCashFlowForecast, detectCashFlowIssues } = require('../../services/analysis/cashFlowService');
const { detectAnomalies } = require('../../services/analysis/anomalyService');
const { syncBankTransactions, findPotentialMatches } = require('../../services/bookkeeping/reconciliationService');
const { applyCategorizationRules } = require('../../services/bookkeeping/categorizationService');
const { getOverdueInvoices, generatePaymentReminder, sendPaymentReminder } = require('../../services/bookkeeping/invoiceService');
const { getUpcomingBillPayments, generatePaymentSchedule } = require('../../services/bookkeeping/paymentService');
const logger = require('../../utils/logger');
const { successResponse, errorResponse } = require('../../utils/response');

/**
 * Get financial KPIs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFinancialKPIs = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { months, toDate } = req.query;
    
    const options = {
      months: months ? parseInt(months) : 3,
      toDate: toDate || new Date()
    };
    
    const kpis = await calculateKPIs(userId, tenantId, options);
    
    return successResponse(res, kpis);
  } catch (error) {
    logger.error('Error in getFinancialKPIs:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get cash flow forecast
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCashFlowForecast = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { days, startDate } = req.query;
    
    const options = {
      days: days ? parseInt(days) : 90,
      startDate: startDate || new Date()
    };
    
    const forecast = await generateCashFlowForecast(userId, tenantId, options);
    
    return successResponse(res, forecast);
  } catch (error) {
    logger.error('Error in getCashFlowForecast:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get cash flow issues
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCashFlowIssues = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { days, startDate, lowBalanceThreshold } = req.query;
    
    const options = {
      days: days ? parseInt(days) : 90,
      startDate: startDate || new Date(),
      lowBalanceThreshold: lowBalanceThreshold ? parseFloat(lowBalanceThreshold) : 5000
    };
    
    const issues = await detectCashFlowIssues(userId, tenantId, options);
    
    return successResponse(res, issues);
  } catch (error) {
    logger.error('Error in getCashFlowIssues:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get financial anomalies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFinancialAnomalies = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { months, toDate } = req.query;
    
    const options = {
      months: months ? parseInt(months) : 3,
      toDate: toDate || new Date()
    };
    
    const anomalies = await detectAnomalies(userId, tenantId, options);
    
    return successResponse(res, anomalies);
  } catch (error) {
    logger.error('Error in getFinancialAnomalies:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Sync bank transactions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const syncTransactions = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { days } = req.query;
    
    const options = {
      days: days ? parseInt(days) : 30
    };
    
    const transactions = await syncBankTransactions(userId, tenantId, options);
    
    return successResponse(res, {
      message: `Synced ${transactions.length} new transactions`,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    logger.error('Error in syncTransactions:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get transaction matches
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTransactionMatches = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return errorResponse(res, 'Transaction ID is required', 400);
    }
    
    const matches = await findPotentialMatches(userId, tenantId, transactionId);
    
    return successResponse(res, matches);
  } catch (error) {
    logger.error('Error in getTransactionMatches:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Apply categorization rules
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const applyCategorization = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { limit } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : 100
    };
    
    const result = await applyCategorizationRules(userId, tenantId, options);
    
    return successResponse(res, {
      message: `Categorized ${result.categorized} out of ${result.total} transactions`,
      ...result
    });
  } catch (error) {
    logger.error('Error in applyCategorization:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get overdue invoices
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOverdueInvoicesEndpoint = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { page, pageSize } = req.query;
    
    const options = {
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 50
    };
    
    const overdueInvoices = await getOverdueInvoices(userId, tenantId, options);
    
    return successResponse(res, overdueInvoices);
  } catch (error) {
    logger.error('Error in getOverdueInvoicesEndpoint:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Generate payment reminder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generatePaymentReminderEndpoint = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { contactId } = req.params;
    
    if (!contactId) {
      return errorResponse(res, 'Contact ID is required', 400);
    }
    
    const reminder = await generatePaymentReminder(userId, tenantId, contactId);
    
    return successResponse(res, reminder);
  } catch (error) {
    logger.error('Error in generatePaymentReminderEndpoint:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Send payment reminder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendPaymentReminderEndpoint = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { contactId } = req.params;
    const { emailAddress, subject, message } = req.body;
    
    if (!contactId) {
      return errorResponse(res, 'Contact ID is required', 400);
    }
    
    const options = {
      emailAddress,
      subject,
      message
    };
    
    const result = await sendPaymentReminder(userId, tenantId, contactId, options);
    
    return successResponse(res, {
      message: `Sent payment reminder to ${contactId} for ${result.reminder.overdueInvoices.length} invoices`,
      ...result
    });
  } catch (error) {
    logger.error('Error in sendPaymentReminderEndpoint:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get upcoming bill payments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUpcomingBillPaymentsEndpoint = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { daysAhead, page, pageSize } = req.query;
    
    const options = {
      daysAhead: daysAhead ? parseInt(daysAhead) : 14,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 50
    };
    
    const upcomingBills = await getUpcomingBillPayments(userId, tenantId, options);
    
    return successResponse(res, upcomingBills);
  } catch (error) {
    logger.error('Error in getUpcomingBillPaymentsEndpoint:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Generate payment schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generatePaymentScheduleEndpoint = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { daysAhead } = req.query;
    
    const options = {
      daysAhead: daysAhead ? parseInt(daysAhead) : 30
    };
    
    const schedule = await generatePaymentSchedule(userId, tenantId, options);
    
    return successResponse(res, schedule);
  } catch (error) {
    logger.error('Error in generatePaymentScheduleEndpoint:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getFinancialKPIs,
  getCashFlowForecast,
  getCashFlowIssues,
  getFinancialAnomalies,
  syncTransactions,
  getTransactionMatches,
  applyCategorization,
  getOverdueInvoicesEndpoint,
  generatePaymentReminderEndpoint,
  sendPaymentReminderEndpoint,
  getUpcomingBillPaymentsEndpoint,
  generatePaymentScheduleEndpoint
};
