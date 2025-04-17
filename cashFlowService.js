/**
 * Cash Flow Forecasting Service
 * Handles cash flow projections and forecasting
 */

const { getInvoices } = require('../xero/invoicesService');
const { getBills } = require('../xero/billsService');
const { getBankTransactions } = require('../xero/bankTransactionsService');
const { getRepeatingInvoices } = require('../xero/invoicesService');
const { getRepeatingBills } = require('../xero/billsService');
const logger = require('../../utils/logger');

/**
 * Generate cash flow forecast
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for forecasting
 * @returns {Object} Cash flow forecast
 */
const generateCashFlowForecast = async (userId, tenantId, options = {}) => {
  try {
    // Set forecast parameters
    const forecastDays = options.days || 90;
    const startDate = options.startDate ? new Date(options.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + forecastDays);
    
    // Format dates for Xero API
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get current bank balances
    const bankAccounts = await getBankTransactions(userId, tenantId, {
      page: 1,
      pageSize: 1
    });
    
    // Get outstanding invoices (accounts receivable)
    const outstandingInvoices = await getInvoices(userId, tenantId, {
      where: `Status=="AUTHORISED" && Type=="ACCREC"`,
      page: 1,
      pageSize: 100
    });
    
    // Get outstanding bills (accounts payable)
    const outstandingBills = await getBills(userId, tenantId, {
      where: `Status=="AUTHORISED"`,
      page: 1,
      pageSize: 100
    });
    
    // Get repeating invoices
    const repeatingInvoices = await getRepeatingInvoices(userId, tenantId, {
      page: 1,
      pageSize: 100
    });
    
    // Get repeating bills
    const repeatingBills = await getRepeatingBills(userId, tenantId, {
      page: 1,
      pageSize: 100
    });
    
    // Initialize forecast data structure
    const forecast = initializeForecast(startDate, forecastDays);
    
    // Set initial bank balance
    let currentBalance = 0;
    if (bankAccounts && bankAccounts.length > 0) {
      // Sum up all bank account balances
      currentBalance = bankAccounts.reduce((sum, account) => {
        return sum + (account.balance || 0);
      }, 0);
    }
    
    forecast.startingBalance = currentBalance;
    forecast.currentBalance = currentBalance;
    
    // Process outstanding invoices
    processOutstandingInvoices(forecast, outstandingInvoices);
    
    // Process outstanding bills
    processOutstandingBills(forecast, outstandingBills);
    
    // Process repeating invoices
    processRepeatingInvoices(forecast, repeatingInvoices, startDate, forecastDays);
    
    // Process repeating bills
    processRepeatingBills(forecast, repeatingBills, startDate, forecastDays);
    
    // Calculate running balances
    calculateRunningBalances(forecast);
    
    // Calculate summary statistics
    calculateSummaryStatistics(forecast);
    
    return forecast;
  } catch (error) {
    logger.error('Error in generateCashFlowForecast:', error);
    throw error;
  }
};

/**
 * Initialize forecast data structure
 * @param {Date} startDate - Start date for forecast
 * @param {number} days - Number of days to forecast
 * @returns {Object} Initialized forecast structure
 */
const initializeForecast = (startDate, days) => {
  const dailyForecasts = [];
  const weeklyForecasts = [];
  const monthlyForecasts = [];
  
  // Initialize daily forecasts
  for (let i = 0; i < days; i++) {
    const forecastDate = new Date(startDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    
    dailyForecasts.push({
      date: forecastDate.toISOString().split('T')[0],
      inflows: [],
      outflows: [],
      totalInflow: 0,
      totalOutflow: 0,
      netCashFlow: 0,
      runningBalance: 0
    });
  }
  
  // Initialize weekly forecasts (group by week)
  const weeksCount = Math.ceil(days / 7);
  for (let i = 0; i < weeksCount; i++) {
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(weekStartDate.getDate() + (i * 7));
    
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    
    weeklyForecasts.push({
      startDate: weekStartDate.toISOString().split('T')[0],
      endDate: weekEndDate.toISOString().split('T')[0],
      totalInflow: 0,
      totalOutflow: 0,
      netCashFlow: 0,
      endingBalance: 0
    });
  }
  
  // Initialize monthly forecasts (group by month)
  let currentMonth = startDate.getMonth();
  let currentYear = startDate.getFullYear();
  const monthlyDates = [];
  
  // Calculate month boundaries
  for (let i = 0; i < days; i++) {
    const forecastDate = new Date(startDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    
    if (forecastDate.getMonth() !== currentMonth || forecastDate.getFullYear() !== currentYear) {
      // Month changed, record the boundary
      monthlyDates.push({
        month: currentMonth,
        year: currentYear,
        endDate: new Date(forecastDate).setDate(forecastDate.getDate() - 1)
      });
      
      currentMonth = forecastDate.getMonth();
      currentYear = forecastDate.getFullYear();
    }
  }
  
  // Add the last month
  monthlyDates.push({
    month: currentMonth,
    year: currentYear,
    endDate: new Date(startDate).setDate(startDate.getDate() + days - 1)
  });
  
  // Create monthly forecast objects
  for (let i = 0; i < monthlyDates.length; i++) {
    const monthData = monthlyDates[i];
    const monthStartDate = i === 0 ? startDate : new Date(monthData.year, monthData.month, 1);
    const monthEndDate = new Date(monthData.endDate);
    
    monthlyForecasts.push({
      month: monthData.month + 1, // 1-based month
      year: monthData.year,
      startDate: monthStartDate.toISOString().split('T')[0],
      endDate: monthEndDate.toISOString().split('T')[0],
      totalInflow: 0,
      totalOutflow: 0,
      netCashFlow: 0,
      endingBalance: 0
    });
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: new Date(startDate.getTime() + (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
    days,
    startingBalance: 0,
    currentBalance: 0,
    lowestBalance: 0,
    lowestBalanceDate: null,
    highestBalance: 0,
    highestBalanceDate: null,
    totalInflow: 0,
    totalOutflow: 0,
    netCashFlow: 0,
    dailyForecasts,
    weeklyForecasts,
    monthlyForecasts
  };
};

/**
 * Process outstanding invoices for cash flow forecast
 * @param {Object} forecast - Forecast data structure
 * @param {Array} invoices - Outstanding invoices
 */
const processOutstandingInvoices = (forecast, invoices) => {
  if (!invoices || invoices.length === 0) {
    return;
  }
  
  for (const invoice of invoices) {
    // Skip if no due date or amount
    if (!invoice.dueDate || !invoice.amountDue) {
      continue;
    }
    
    const dueDate = new Date(invoice.dueDate).toISOString().split('T')[0];
    
    // Find the forecast day for this due date
    const forecastDay = forecast.dailyForecasts.find(day => day.date === dueDate);
    
    if (forecastDay) {
      // Add to inflows
      forecastDay.inflows.push({
        type: 'INVOICE',
        id: invoice.invoiceID,
        reference: invoice.invoiceNumber,
        description: `Invoice ${invoice.invoiceNumber} - ${invoice.contact?.name || 'Unknown'}`,
        amount: invoice.amountDue,
        probability: estimatePaymentProbability(invoice)
      });
      
      // Add to total (weighted by probability)
      const weightedAmount = invoice.amountDue * estimatePaymentProbability(invoice) / 100;
      forecastDay.totalInflow += weightedAmount;
      forecastDay.netCashFlow += weightedAmount;
    }
  }
};

/**
 * Process outstanding bills for cash flow forecast
 * @param {Object} forecast - Forecast data structure
 * @param {Array} bills - Outstanding bills
 */
const processOutstandingBills = (forecast, bills) => {
  if (!bills || bills.length === 0) {
    return;
  }
  
  for (const bill of bills) {
    // Skip if no due date or amount
    if (!bill.dueDate || !bill.amountDue) {
      continue;
    }
    
    const dueDate = new Date(bill.dueDate).toISOString().split('T')[0];
    
    // Find the forecast day for this due date
    const forecastDay = forecast.dailyForecasts.find(day => day.date === dueDate);
    
    if (forecastDay) {
      // Add to outflows
      forecastDay.outflows.push({
        type: 'BILL',
        id: bill.invoiceID,
        reference: bill.invoiceNumber,
        description: `Bill ${bill.invoiceNumber} - ${bill.contact?.name || 'Unknown'}`,
        amount: bill.amountDue,
        probability: 100 // Bills are assumed to be paid on time
      });
      
      // Add to total
      forecastDay.totalOutflow += bill.amountDue;
      forecastDay.netCashFlow -= bill.amountDue;
    }
  }
};

/**
 * Process repeating invoices for cash flow forecast
 * @param {Object} forecast - Forecast data structure
 * @param {Array} repeatingInvoices - Repeating invoices
 * @param {Date} startDate - Start date for forecast
 * @param {number} days - Number of days to forecast
 */
const processRepeatingInvoices = (forecast, repeatingInvoices, startDate, days) => {
  if (!repeatingInvoices || repeatingInvoices.length === 0) {
    return;
  }
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);
  
  for (const repeatingInvoice of repeatingInvoices) {
    // Skip if not active
    if (!repeatingInvoice.status || repeatingInvoice.status !== 'ACTIVE') {
      continue;
    }
    
    // Calculate next occurrence dates
    const occurrences = calculateOccurrences(
      repeatingInvoice.schedule,
      startDate,
      endDate
    );
    
    for (const occurrenceDate of occurrences) {
      const dateStr = occurrenceDate.toISOString().split('T')[0];
      
      // Find the forecast day for this date
      const forecastDay = forecast.dailyForecasts.find(day => day.date === dateStr);
      
      if (forecastDay) {
        // Add to inflows
        forecastDay.inflows.push({
          type: 'REPEATING_INVOICE',
          id: repeatingInvoice.repeatingInvoiceID,
          reference: repeatingInvoice.reference,
          description: `Recurring Invoice - ${repeatingInvoice.contact?.name || 'Unknown'}`,
          amount: repeatingInvoice.amount,
          probability: 80 // Assumed probability for recurring invoices
        });
        
        // Add to total (weighted by probability)
        const weightedAmount = repeatingInvoice.amount * 0.8; // 80% probability
        forecastDay.totalInflow += weightedAmount;
        forecastDay.netCashFlow += weightedAmount;
      }
    }
  }
};

/**
 * Process repeating bills for cash flow forecast
 * @param {Object} forecast - Forecast data structure
 * @param {Array} repeatingBills - Repeating bills
 * @param {Date} startDate - Start date for forecast
 * @param {number} days - Number of days to forecast
 */
const processRepeatingBills = (forecast, repeatingBills, startDate, days) => {
  if (!repeatingBills || repeatingBills.length === 0) {
    return;
  }
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);
  
  for (const repeatingBill of repeatingBills) {
    // Skip if not active
    if (!repeatingBill.status || repeatingBill.status !== 'ACTIVE') {
      continue;
    }
    
    // Calculate next occurrence dates
    const occurrences = calculateOccurrences(
      repeatingBill.schedule,
      startDate,
      endDate
    );
    
    for (const occurrenceDate of occurrences) {
      const dateStr = occurrenceDate.toISOString().split('T')[0];
      
      // Find the forecast day for this date
      const forecastDay = forecast.dailyForecasts.find(day => day.date === dateStr);
      
      if (forecastDay) {
        // Add to outflows
        forecastDay.outflows.push({
          type: 'REPEATING_BILL',
          id: repeatingBill.repeatingBillID,
          reference: repeatingBill.reference,
          description: `Recurring Bill - ${repeatingBill.contact?.name || 'Unknown'}`,
          amount: repeatingBill.amount,
          probability: 100 // Bills are assumed to be paid on time
        });
        
        // Add to total
        forecastDay.totalOutflow += repeatingBill.amount;
        forecastDay.netCashFlow -= repeatingBill.amount;
      }
    }
  }
};

/**
 * Calculate occurrence dates based on schedule
 * @param {Object} schedule - Schedule configuration
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Array of occurrence dates
 */
const calculateOccurrences = (schedule, startDate, endDate) => {
  // This is a simplified implementation
  // In a real implementation, we would need to handle various
  // schedule types (daily, weekly, monthly, etc.)
  
  const occurrences = [];
  
  // Default to monthly if no schedule provided
  const frequency = schedule?.unit || 'MONTHLY';
  const interval = schedule?.interval || 1;
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    occurrences.push(new Date(currentDate));
    
    // Advance to next occurrence
    switch (frequency) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + (interval * 7));
        break;
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      case 'YEARLY':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
      default:
        currentDate.setMonth(currentDate.getMonth() + interval);
    }
  }
  
  return occurrences;
};

/**
 * Estimate payment probability based on invoice details
 * @param {Object} invoice - Invoice object
 * @returns {number} Probability percentage (0-100)
 */
const estimatePaymentProbability = (invoice) => {
  // This is a simplified implementation
  // In a real implementation, we would use historical payment data,
  // customer payment history, and other factors
  
  // Base probability
  let probability = 80;
  
  // Adjust based on days overdue
  const dueDate = new Date(invoice.dueDate);
  const today = new Date();
  
  if (dueDate < today) {
    // Invoice is overdue
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    
    if (daysOverdue <= 7) {
      probability -= 10; // 1 week overdue
    } else if (daysOverdue <= 30) {
      probability -= 30; // 1 month overdue
    } else if (daysOverdue <= 90) {
      probability -= 50; // 3 months overdue
    } else {
      probability -= 70; // More than 3 months overdue
    }
  }
  
  // Ensure probability is between 0 and 100
  return Math.max(0, Math.min(100, probability));
};

/**
 * Calculate running balances for forecast
 * @param {Object} forecast - Forecast data structure
 */
const calculateRunningBalances = (forecast) => {
  let runningBalance = forecast.currentBalance;
  
  // Calculate daily running balances
  for (const day of forecast.dailyForecasts) {
    runningBalance += day.netCashFlow;
    day.runningBalance = runningBalance;
  }
  
  // Calculate weekly summaries
  for (const week of forecast.weeklyForecasts) {
    const weekDays = forecast.dailyForecasts.filter(day => {
      return day.date >= week.startDate && day.date <= week.endDate;
    });
    
    week.totalInflow = weekDays.reduce((sum, day) => sum + day.totalInflow, 0);
    week.totalOutflow = weekDays.reduce((sum, day) => sum + day.totalOutflow, 0);
    week.netCashFlow = week.totalInflow - week.totalOutflow;
    
    // Get ending balance from the last day of the week
    const lastDay = weekDays[weekDays.length - 1];
    week.endingBalance = lastDay ? lastDay.runningBalance : 0;
  }
  
  // Calculate monthly summaries
  for (const month of forecast.monthlyForecasts) {
    const monthDays = forecast.dailyForecasts.filter(day => {
      return day.date >= month.startDate && day.date <= month.endDate;
    });
    
    month.totalInflow = monthDays.reduce((sum, day) => sum + day.totalInflow, 0);
    month.totalOutflow = monthDays.reduce((sum, day) => sum + day.totalOutflow, 0);
    month.netCashFlow = month.totalInflow - month.totalOutflow;
    
    // Get ending balance from the last day of the month
    const lastDay = monthDays[monthDays.length - 1];
    month.endingBalance = lastDay ? lastDay.runningBalance : 0;
  }
};

/**
 * Calculate summary statistics for forecast
 * @param {Object} forecast - Forecast data structure
 */
const calculateSummaryStatistics = (forecast) => {
  // Calculate total inflow and outflow
  forecast.totalInflow = forecast.dailyForecasts.reduce((sum, day) => sum + day.totalInflow, 0);
  forecast.totalOutflow = forecast.dailyForecasts.reduce((sum, day) => sum + day.totalOutflow, 0);
  forecast.netCashFlow = forecast.totalInflow - forecast.totalOutflow;
  
  // Find lowest and highest balances
  let lowestBalance = forecast.currentBalance;
  let lowestBalanceDate = forecast.startDate;
  let highestBalance = forecast.currentBalance;
  let highestBalanceDate = forecast.startDate;
  
  for (const day of forecast.dailyForecasts) {
    if (day.runningBalance < lowestBalance) {
      lowestBalance = day.runningBalance;
      lowestBalanceDate = day.date;
    }
    
    if (day.runningBalance > highestBalance) {
      highestBalance = day.runningBalance;
      highestBalanceDate = day.date;
    }
  }
  
  forecast.lowestBalance = lowestBalance;
  forecast.lowestBalanceDate = lowestBalanceDate;
  forecast.highestBalance = highestBalance;
  forecast.highestBalanceDate = highestBalanceDate;
};

/**
 * Detect cash flow issues in forecast
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for detection
 * @returns {Object} Cash flow issues
 */
const detectCashFlowIssues = async (userId, tenantId, options = {}) => {
  try {
    // Generate cash flow forecast
    const forecast = await generateCashFlowForecast(userId, tenantId, options);
    
    // Initialize issues array
    const issues = [];
    
    // Check for negative balance
    const negativeDays = forecast.dailyForecasts.filter(day => day.runningBalance < 0);
    
    if (negativeDays.length > 0) {
      const firstNegativeDay = negativeDays[0];
      
      issues.push({
        type: 'NEGATIVE_BALANCE',
        severity: 'HIGH',
        date: firstNegativeDay.date,
        description: `Projected negative cash balance of ${firstNegativeDay.runningBalance.toFixed(2)} on ${firstNegativeDay.date}`,
        recommendations: [
          'Accelerate customer payments',
          'Delay non-essential expenses',
          'Consider short-term financing options'
        ]
      });
    }
    
    // Check for low balance
    const lowBalanceThreshold = options.lowBalanceThreshold || 5000;
    const lowBalanceDays = forecast.dailyForecasts.filter(day => 
      day.runningBalance >= 0 && day.runningBalance < lowBalanceThreshold
    );
    
    if (lowBalanceDays.length > 0 && negativeDays.length === 0) {
      const firstLowDay = lowBalanceDays[0];
      
      issues.push({
        type: 'LOW_BALANCE',
        severity: 'MEDIUM',
        date: firstLowDay.date,
        description: `Projected low cash balance of ${firstLowDay.runningBalance.toFixed(2)} on ${firstLowDay.date}`,
        recommendations: [
          'Review upcoming expenses',
          'Prioritize customer collections',
          'Prepare contingency plans'
        ]
      });
    }
    
    // Check for significant cash outflows
    const significantOutflowThreshold = options.significantOutflowThreshold || 10000;
    const significantOutflowDays = forecast.dailyForecasts.filter(day => 
      day.totalOutflow > significantOutflowThreshold
    );
    
    if (significantOutflowDays.length > 0) {
      for (const outflowDay of significantOutflowDays) {
        issues.push({
          type: 'SIGNIFICANT_OUTFLOW',
          severity: 'MEDIUM',
          date: outflowDay.date,
          description: `Significant cash outflow of ${outflowDay.totalOutflow.toFixed(2)} on ${outflowDay.date}`,
          details: outflowDay.outflows.map(outflow => ({
            description: outflow.description,
            amount: outflow.amount
          })),
          recommendations: [
            'Verify all large payments are necessary',
            'Consider renegotiating payment terms',
            'Ensure sufficient funds are available'
          ]
        });
      }
    }
    
    // Check for cash flow trend
    const weeklyTrend = analyzeWeeklyTrend(forecast.weeklyForecasts);
    
    if (weeklyTrend === 'DECLINING') {
      issues.push({
        type: 'DECLINING_CASH_FLOW',
        severity: 'MEDIUM',
        description: 'Cash flow is projected to decline over the forecast period',
        recommendations: [
          'Review pricing strategy',
          'Identify cost-saving opportunities',
          'Develop new revenue streams'
        ]
      });
    }
    
    return {
      issues,
      forecast: {
        startDate: forecast.startDate,
        endDate: forecast.endDate,
        startingBalance: forecast.startingBalance,
        lowestBalance: forecast.lowestBalance,
        lowestBalanceDate: forecast.lowestBalanceDate,
        totalInflow: forecast.totalInflow,
        totalOutflow: forecast.totalOutflow,
        netCashFlow: forecast.netCashFlow
      }
    };
  } catch (error) {
    logger.error('Error in detectCashFlowIssues:', error);
    throw error;
  }
};

/**
 * Analyze weekly cash flow trend
 * @param {Array} weeklyForecasts - Weekly forecast data
 * @returns {string} Trend direction
 */
const analyzeWeeklyTrend = (weeklyForecasts) => {
  if (weeklyForecasts.length < 2) {
    return 'STABLE';
  }
  
  // Calculate week-over-week changes
  const changes = [];
  
  for (let i = 1; i < weeklyForecasts.length; i++) {
    const currentWeek = weeklyForecasts[i];
    const previousWeek = weeklyForecasts[i - 1];
    
    changes.push(currentWeek.netCashFlow - previousWeek.netCashFlow);
  }
  
  // Count positive and negative changes
  const positiveChanges = changes.filter(change => change > 0).length;
  const negativeChanges = changes.filter(change => change < 0).length;
  
  // Determine trend
  if (positiveChanges > negativeChanges * 2) {
    return 'IMPROVING';
  } else if (negativeChanges > positiveChanges * 2) {
    return 'DECLINING';
  } else {
    return 'STABLE';
  }
};

module.exports = {
  generateCashFlowForecast,
  detectCashFlowIssues
};
