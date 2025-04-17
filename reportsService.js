/**
 * Xero Reports service for generating and retrieving reports from Xero
 */

const { getXeroClient, handleXeroError } = require('./xeroClient');
const logger = require('../../utils/logger');

/**
 * Get a list of available report types
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @returns {Array} List of report types
 */
const getReportTypes = async (userId, tenantId) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get report types from Xero
    const response = await xero.accountingApi.getReportTypes(tenant.tenantId);

    return response.body.reports;
  } catch (error) {
    logger.error('Error in getReportTypes:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get a specific report
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} reportId - Report ID/name
 * @param {Object} options - Report options
 * @returns {Object} Report data
 */
const getReport = async (userId, tenantId, reportId, options = {}) => {
  try {
    const { xero, tenant } = await getXeroClient(userId, tenantId);
    
    // Get report from Xero
    const response = await xero.accountingApi.getReportWithParams(
      tenant.tenantId,
      reportId,
      options
    );

    return response.body.reports[0];
  } catch (error) {
    logger.error('Error in getReport:', error);
    throw handleXeroError(error);
  }
};

/**
 * Get profit and loss report
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Report options
 * @returns {Object} Profit and loss report
 */
const getProfitAndLoss = async (userId, tenantId, options = {}) => {
  try {
    const reportOptions = {
      fromDate: options.fromDate,
      toDate: options.toDate,
      periods: options.periods,
      timeframe: options.timeframe,
      trackingCategoryID: options.trackingCategoryID,
      trackingOptionID: options.trackingOptionID,
      trackingCategoryID2: options.trackingCategoryID2,
      trackingOptionID2: options.trackingOptionID2,
      standardLayout: options.standardLayout !== undefined ? options.standardLayout : true,
      paymentsOnly: options.paymentsOnly
    };
    
    return await getReport(userId, tenantId, 'ProfitAndLoss', reportOptions);
  } catch (error) {
    logger.error('Error in getProfitAndLoss:', error);
    throw error;
  }
};

/**
 * Get balance sheet report
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Report options
 * @returns {Object} Balance sheet report
 */
const getBalanceSheet = async (userId, tenantId, options = {}) => {
  try {
    const reportOptions = {
      date: options.date,
      periods: options.periods,
      timeframe: options.timeframe,
      trackingCategoryID: options.trackingCategoryID,
      trackingOptionID: options.trackingOptionID,
      trackingCategoryID2: options.trackingCategoryID2,
      trackingOptionID2: options.trackingOptionID2,
      standardLayout: options.standardLayout !== undefined ? options.standardLayout : true,
      paymentsOnly: options.paymentsOnly
    };
    
    return await getReport(userId, tenantId, 'BalanceSheet', reportOptions);
  } catch (error) {
    logger.error('Error in getBalanceSheet:', error);
    throw error;
  }
};

/**
 * Get cash summary report
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Report options
 * @returns {Object} Cash summary report
 */
const getCashSummary = async (userId, tenantId, options = {}) => {
  try {
    const reportOptions = {
      fromDate: options.fromDate,
      toDate: options.toDate
    };
    
    return await getReport(userId, tenantId, 'BankSummary', reportOptions);
  } catch (error) {
    logger.error('Error in getCashSummary:', error);
    throw error;
  }
};

/**
 * Get budget summary report
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Report options
 * @returns {Object} Budget summary report
 */
const getBudgetSummary = async (userId, tenantId, options = {}) => {
  try {
    const reportOptions = {
      date: options.date,
      periods: options.periods,
      timeframe: options.timeframe
    };
    
    return await getReport(userId, tenantId, 'BudgetSummary', reportOptions);
  } catch (error) {
    logger.error('Error in getBudgetSummary:', error);
    throw error;
  }
};

/**
 * Get aged receivables report
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Report options
 * @returns {Object} Aged receivables report
 */
const getAgedReceivables = async (userId, tenantId, options = {}) => {
  try {
    const reportOptions = {
      date: options.date,
      fromDate: options.fromDate,
      toDate: options.toDate,
      contactID: options.contactID
    };
    
    return await getReport(userId, tenantId, 'AgedReceivablesByContact', reportOptions);
  } catch (error) {
    logger.error('Error in getAgedReceivables:', error);
    throw error;
  }
};

/**
 * Get aged payables report
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Report options
 * @returns {Object} Aged payables report
 */
const getAgedPayables = async (userId, tenantId, options = {}) => {
  try {
    const reportOptions = {
      date: options.date,
      fromDate: options.fromDate,
      toDate: options.toDate,
      contactID: options.contactID
    };
    
    return await getReport(userId, tenantId, 'AgedPayablesByContact', reportOptions);
  } catch (error) {
    logger.error('Error in getAgedPayables:', error);
    throw error;
  }
};

/**
 * Get trial balance report
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Report options
 * @returns {Object} Trial balance report
 */
const getTrialBalance = async (userId, tenantId, options = {}) => {
  try {
    const reportOptions = {
      date: options.date,
      paymentsOnly: options.paymentsOnly
    };
    
    return await getReport(userId, tenantId, 'TrialBalance', reportOptions);
  } catch (error) {
    logger.error('Error in getTrialBalance:', error);
    throw error;
  }
};

module.exports = {
  getReportTypes,
  getReport,
  getProfitAndLoss,
  getBalanceSheet,
  getCashSummary,
  getBudgetSummary,
  getAgedReceivables,
  getAgedPayables,
  getTrialBalance
};
