/**
 * Anomaly Detection Service
 * Handles detection of financial anomalies and unusual patterns
 */

const { getInvoices } = require('../xero/invoicesService');
const { getBills } = require('../xero/billsService');
const { getBankTransactions } = require('../xero/bankTransactionsService');
const { getProfitAndLoss } = require('../xero/reportsService');
const Transaction = require('../../models/Transaction');
const logger = require('../../utils/logger');
const { Op } = require('sequelize');

/**
 * Detect financial anomalies
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for detection
 * @returns {Object} Detected anomalies
 */
const detectAnomalies = async (userId, tenantId, options = {}) => {
  try {
    // Get date range
    const toDate = options.toDate || new Date();
    const fromDate = new Date(toDate);
    fromDate.setMonth(fromDate.getMonth() - (options.months || 3));
    
    // Format dates for Xero API
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];
    
    // Initialize anomalies array
    const anomalies = [];
    
    // Detect transaction anomalies
    const transactionAnomalies = await detectTransactionAnomalies(
      userId, tenantId, fromDateStr, toDateStr
    );
    anomalies.push(...transactionAnomalies);
    
    // Detect invoice anomalies
    const invoiceAnomalies = await detectInvoiceAnomalies(
      userId, tenantId, fromDateStr, toDateStr
    );
    anomalies.push(...invoiceAnomalies);
    
    // Detect expense anomalies
    const expenseAnomalies = await detectExpenseAnomalies(
      userId, tenantId, fromDateStr, toDateStr
    );
    anomalies.push(...expenseAnomalies);
    
    // Detect profit margin anomalies
    const profitMarginAnomalies = await detectProfitMarginAnomalies(
      userId, tenantId, fromDateStr, toDateStr
    );
    anomalies.push(...profitMarginAnomalies);
    
    // Sort anomalies by severity and date
    anomalies.sort((a, b) => {
      const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.date || b.period?.toDate || 0) - new Date(a.date || a.period?.toDate || 0);
    });
    
    return {
      anomalies,
      period: {
        fromDate: fromDateStr,
        toDate: toDateStr
      }
    };
  } catch (error) {
    logger.error('Error in detectAnomalies:', error);
    throw error;
  }
};

/**
 * Detect transaction anomalies
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} fromDate - Start date
 * @param {string} toDate - End date
 * @returns {Array} Transaction anomalies
 */
const detectTransactionAnomalies = async (userId, tenantId, fromDate, toDate) => {
  try {
    // Get bank transactions from Xero
    const bankTransactions = await getBankTransactions(userId, tenantId, {
      where: `Date >= DateTime(${fromDate}) && Date <= DateTime(${toDate})`,
      page: 1,
      pageSize: 100
    });
    
    // Get local transactions
    const localTransactions = await Transaction.findAll({
      where: {
        userId,
        tenantId,
        type: 'BANK',
        date: {
          [Op.between]: [new Date(fromDate), new Date(toDate)]
        }
      }
    });
    
    const anomalies = [];
    
    // Analyze transactions for unusual amounts
    const amounts = bankTransactions.map(tx => Math.abs(tx.total));
    const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const stdDevAmount = calculateStandardDeviation(amounts);
    
    // Threshold for unusual amounts (3 standard deviations)
    const unusualThreshold = avgAmount + (3 * stdDevAmount);
    
    // Find transactions with unusual amounts
    for (const tx of bankTransactions) {
      const amount = Math.abs(tx.total);
      
      if (amount > unusualThreshold) {
        anomalies.push({
          type: 'UNUSUAL_TRANSACTION_AMOUNT',
          severity: 'MEDIUM',
          date: tx.date,
          description: `Unusually large transaction: ${tx.reference || tx.subTitle || 'Unknown'} - $${amount.toFixed(2)}`,
          details: {
            transactionId: tx.bankTransactionID,
            reference: tx.reference,
            description: tx.subTitle,
            amount: tx.total,
            averageAmount: avgAmount,
            threshold: unusualThreshold
          }
        });
      }
    }
    
    // Detect duplicate transactions
    const potentialDuplicates = findPotentialDuplicates(bankTransactions);
    
    for (const duplicate of potentialDuplicates) {
      anomalies.push({
        type: 'POTENTIAL_DUPLICATE_TRANSACTION',
        severity: 'HIGH',
        date: duplicate.transactions[0].date,
        description: `Potential duplicate transactions: ${duplicate.transactions.length} transactions for $${duplicate.amount.toFixed(2)} each`,
        details: {
          transactionIds: duplicate.transactions.map(tx => tx.bankTransactionID),
          references: duplicate.transactions.map(tx => tx.reference),
          amount: duplicate.amount,
          dates: duplicate.transactions.map(tx => tx.date)
        }
      });
    }
    
    return anomalies;
  } catch (error) {
    logger.error('Error in detectTransactionAnomalies:', error);
    return [];
  }
};

/**
 * Detect invoice anomalies
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} fromDate - Start date
 * @param {string} toDate - End date
 * @returns {Array} Invoice anomalies
 */
const detectInvoiceAnomalies = async (userId, tenantId, fromDate, toDate) => {
  try {
    // Get invoices from Xero
    const invoices = await getInvoices(userId, tenantId, {
      where: `Date >= DateTime(${fromDate}) && Date <= DateTime(${toDate}) && Type=="ACCREC"`,
      page: 1,
      pageSize: 100
    });
    
    const anomalies = [];
    
    // Analyze invoices for unusual amounts
    const amounts = invoices.map(inv => inv.total);
    const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const stdDevAmount = calculateStandardDeviation(amounts);
    
    // Threshold for unusual amounts (3 standard deviations)
    const unusualThreshold = avgAmount + (3 * stdDevAmount);
    
    // Find invoices with unusual amounts
    for (const inv of invoices) {
      if (inv.total > unusualThreshold) {
        anomalies.push({
          type: 'UNUSUAL_INVOICE_AMOUNT',
          severity: 'MEDIUM',
          date: inv.date,
          description: `Unusually large invoice: #${inv.invoiceNumber} - $${inv.total.toFixed(2)}`,
          details: {
            invoiceId: inv.invoiceID,
            invoiceNumber: inv.invoiceNumber,
            contact: inv.contact?.name,
            amount: inv.total,
            averageAmount: avgAmount,
            threshold: unusualThreshold
          }
        });
      }
    }
    
    // Detect long overdue invoices
    const today = new Date();
    const overdueInvoices = invoices.filter(inv => {
      if (inv.status !== 'AUTHORISED') return false;
      
      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      
      return daysOverdue > 60; // More than 60 days overdue
    });
    
    for (const inv of overdueInvoices) {
      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      
      anomalies.push({
        type: 'LONG_OVERDUE_INVOICE',
        severity: 'HIGH',
        date: inv.dueDate,
        description: `Invoice #${inv.invoiceNumber} is ${daysOverdue} days overdue - $${inv.amountDue.toFixed(2)}`,
        details: {
          invoiceId: inv.invoiceID,
          invoiceNumber: inv.invoiceNumber,
          contact: inv.contact?.name,
          amount: inv.amountDue,
          dueDate: inv.dueDate,
          daysOverdue
        }
      });
    }
    
    return anomalies;
  } catch (error) {
    logger.error('Error in detectInvoiceAnomalies:', error);
    return [];
  }
};

/**
 * Detect expense anomalies
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} fromDate - Start date
 * @param {string} toDate - End date
 * @returns {Array} Expense anomalies
 */
const detectExpenseAnomalies = async (userId, tenantId, fromDate, toDate) => {
  try {
    // Get bills from Xero
    const bills = await getBills(userId, tenantId, {
      where: `Date >= DateTime(${fromDate}) && Date <= DateTime(${toDate})`,
      page: 1,
      pageSize: 100
    });
    
    const anomalies = [];
    
    // Group bills by expense account
    const expensesByAccount = {};
    
    for (const bill of bills) {
      if (!bill.lineItems) continue;
      
      for (const lineItem of bill.lineItems) {
        if (!lineItem.accountCode) continue;
        
        if (!expensesByAccount[lineItem.accountCode]) {
          expensesByAccount[lineItem.accountCode] = {
            accountCode: lineItem.accountCode,
            accountName: lineItem.accountName,
            amounts: []
          };
        }
        
        expensesByAccount[lineItem.accountCode].amounts.push(lineItem.lineAmount);
      }
    }
    
    // Analyze each expense account for unusual spending
    for (const accountCode in expensesByAccount) {
      const account = expensesByAccount[accountCode];
      
      if (account.amounts.length < 3) continue; // Need at least 3 data points
      
      const amounts = account.amounts;
      const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const stdDevAmount = calculateStandardDeviation(amounts);
      
      // Threshold for unusual amounts (2.5 standard deviations)
      const unusualThreshold = avgAmount + (2.5 * stdDevAmount);
      
      // Find unusual expenses
      const unusualExpenses = amounts.filter(amount => amount > unusualThreshold);
      
      if (unusualExpenses.length > 0) {
        anomalies.push({
          type: 'UNUSUAL_EXPENSE_PATTERN',
          severity: 'MEDIUM',
          period: {
            fromDate,
            toDate
          },
          description: `Unusual spending in ${account.accountName} (${account.accountCode})`,
          details: {
            accountCode: account.accountCode,
            accountName: account.accountName,
            averageAmount: avgAmount,
            threshold: unusualThreshold,
            unusualExpenses: unusualExpenses.length,
            totalExpenses: amounts.length
          }
        });
      }
    }
    
    return anomalies;
  } catch (error) {
    logger.error('Error in detectExpenseAnomalies:', error);
    return [];
  }
};

/**
 * Detect profit margin anomalies
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} fromDate - Start date
 * @param {string} toDate - End date
 * @returns {Array} Profit margin anomalies
 */
const detectProfitMarginAnomalies = async (userId, tenantId, fromDate, toDate) => {
  try {
    // Get profit and loss report
    const profitLoss = await getProfitAndLoss(userId, tenantId, {
      fromDate,
      toDate,
      periods: 3 // Get monthly breakdown
    });
    
    const anomalies = [];
    
    // Extract monthly data
    const monthlyData = [];
    
    if (profitLoss && profitLoss.rows) {
      // Find revenue row
      const revenueRow = profitLoss.rows.find(row => 
        row.cells && row.cells[0] && row.cells[0].value === 'Revenue'
      );
      
      // Find cost of sales row
      const cosRow = profitLoss.rows.find(row => 
        row.cells && row.cells[0] && row.cells[0].value === 'Cost of Sales'
      );
      
      // Find gross profit row
      const grossProfitRow = profitLoss.rows.find(row => 
        row.cells && row.cells[0] && row.cells[0].value === 'Gross Profit'
      );
      
      // Find net profit row
      const netProfitRow = profitLoss.rows.find(row => 
        row.cells && row.cells[0] && row.cells[0].value === 'Net Profit'
      );
      
      if (revenueRow && grossProfitRow && netProfitRow) {
        // Skip first cell (label) and last cell (total)
        for (let i = 1; i < revenueRow.cells.length - 1; i++) {
          const periodLabel = profitLoss.columns[i].value;
          const revenue = parseFloat(revenueRow.cells[i].value) || 0;
          const costOfSales = cosRow ? (parseFloat(cosRow.cells[i].value) || 0) : 0;
          const grossProfit = parseFloat(grossProfitRow.cells[i].value) || 0;
          const netProfit = parseFloat(netProfitRow.cells[i].value) || 0;
          
          const grossMargin = revenue !== 0 ? (grossProfit / revenue) * 100 : 0;
          const netMargin = revenue !== 0 ? (netProfit / revenue) * 100 : 0;
          
          monthlyData.push({
            period: periodLabel,
            revenue,
            costOfSales,
            grossProfit,
            netProfit,
            grossMargin,
            netMargin
          });
        }
      }
    }
    
    // Need at least 2 months of data
    if (monthlyData.length >= 2) {
      // Check for significant margin decline
      for (let i = 1; i < monthlyData.length; i++) {
        const current = monthlyData[i];
        const previous = monthlyData[i - 1];
        
        // Check gross margin decline
        const grossMarginChange = current.grossMargin - previous.grossMargin;
        if (grossMarginChange < -5 && previous.grossMargin > 0) {
          // More than 5 percentage points decline
          anomalies.push({
            type: 'GROSS_MARGIN_DECLINE',
            severity: 'HIGH',
            period: {
              fromDate: previous.period,
              toDate: current.period
            },
            description: `Gross profit margin declined from ${previous.grossMargin.toFixed(1)}% to ${current.grossMargin.toFixed(1)}%`,
            details: {
              currentPeriod: current.period,
              previousPeriod: previous.period,
              currentMargin: current.grossMargin,
              previousMargin: previous.grossMargin,
              change: grossMarginChange,
              currentRevenue: current.revenue,
              previousRevenue: previous.revenue
            }
          });
        }
        
        // Check net margin decline
        const netMarginChange = current.netMargin - previous.netMargin;
        if (netMarginChange < -5 && previous.netMargin > 0) {
          // More than 5 percentage points decline
          anomalies.push({
            type: 'NET_MARGIN_DECLINE',
            severity: 'HIGH',
            period: {
              fromDate: previous.period,
              toDate: current.period
            },
            description: `Net profit margin declined from ${previous.netMargin.toFixed(1)}% to ${current.netMargin.toFixed(1)}%`,
            details: {
              currentPeriod: current.period,
              previousPeriod: previous.period,
              currentMargin: current.netMargin,
              previousMargin: previous.netMargin,
              change: netMarginChange,
              currentRevenue: current.revenue,
              previousRevenue: previous.revenue
            }
          });
        }
      }
    }
    
    return anomalies;
  } catch (error) {
    logger.error('Error in detectProfitMarginAnomalies:', error);
    return [];
  }
};

/**
 * Find potential duplicate transactions
 * @param {Array} transactions - Bank transactions
 * @returns {Array} Potential duplicates
 */
const findPotentialDuplicates = (transactions) => {
  const duplicates = [];
  const transactionMap = {};
  
  // Group transactions by amount
  for (const tx of transactions) {
    const amount = Math.abs(tx.total);
    const key = amount.toFixed(2);
    
    if (!transactionMap[key]) {
      transactionMap[key] = [];
    }
    
    transactionMap[key].push(tx);
  }
  
  // Find groups with multiple transactions
  for (const amount in transactionMap) {
    const txGroup = transactionMap[amount];
    
    if (txGroup.length >= 2) {
      // Check for transactions within 7 days of each other
      const potentialDuplicates = [];
      
      for (let i = 0; i < txGroup.length; i++) {
        for (let j = i + 1; j < txGroup.length; j++) {
          const tx1 = txGroup[i];
          const tx2 = txGroup[j];
          
          const date1 = new Date(tx1.date);
          const date2 = new Date(tx2.date);
          
          const daysDiff = Math.abs((date1 - date2) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 7) {
            // Check for similar references or descriptions
            let similarText = false;
            
            if (tx1.reference && tx2.reference) {
              similarText = stringSimilarity(tx1.reference, tx2.reference) > 0.7;
            } else if (tx1.subTitle && tx2.subTitle) {
              similarText = stringSimilarity(tx1.subTitle, tx2.subTitle) > 0.7;
            }
            
            if (similarText) {
              potentialDuplicates.push(tx1);
              potentialDuplicates.push(tx2);
            }
          }
        }
      }
      
      // Remove duplicates from the potential duplicates array
      const uniqueTxIds = new Set();
      const uniquePotentialDuplicates = [];
      
      for (const tx of potentialDuplicates) {
        if (!uniqueTxIds.has(tx.bankTransactionID)) {
          uniqueTxIds.add(tx.bankTransactionID);
          uniquePotentialDuplicates.push(tx);
        }
      }
      
      if (uniquePotentialDuplicates.length >= 2) {
        duplicates.push({
          amount: parseFloat(amount),
          transactions: uniquePotentialDuplicates
        });
      }
    }
  }
  
  return duplicates;
};

/**
 * Calculate string similarity (Levenshtein distance based)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
const stringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Quick check for exact match
  if (str1 === str2) return 1;
  
  // Quick check for empty strings
  if (len1 === 0 || len2 === 0) return 0;
  
  // Use Levenshtein distance
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLen = Math.max(len1, len2);
  
  return 1 - (distance / maxLen);
};

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Levenshtein distance
 */
const levenshteinDistance = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create matrix
  const matrix = [];
  
  // Initialize first row
  for (let i = 0; i <= len2; i++) {
    matrix[0] = matrix[0] || [];
    matrix[0][i] = i;
  }
  
  // Initialize first column
  for (let i = 0; i <= len1; i++) {
    matrix[i] = matrix[i] || [];
    matrix[i][0] = i;
  }
  
  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[len1][len2];
};

/**
 * Calculate standard deviation
 * @param {Array} values - Array of numbers
 * @returns {number} Standard deviation
 */
const calculateStandardDeviation = (values) => {
  const n = values.length;
  
  if (n === 0) return 0;
  
  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / n;
  
  return Math.sqrt(variance);
};

/**
 * Generate anomaly report
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for report
 * @returns {Object} Anomaly report
 */
const generateAnomalyReport = async (userId, tenantId, options = {}) => {
  try {
    // Detect anomalies
    const anomalyData = await detectAnomalies(userId, tenantId, options);
    
    // Group anomalies by type
    const groupedAnomalies = {};
    
    for (const anomaly of anomalyData.anomalies) {
      if (!groupedAnomalies[anomaly.type]) {
        groupedAnomalies[anomaly.type] = [];
      }
      
      groupedAnomalies[anomaly.type].push(anomaly);
    }
    
    // Generate summary
    const summary = {
      totalAnomalies: anomalyData.anomalies.length,
      highSeverity: anomalyData.anomalies.filter(a => a.severity === 'HIGH').length,
      mediumSeverity: anomalyData.anomalies.filter(a => a.severity === 'MEDIUM').length,
      lowSeverity: anomalyData.anomalies.filter(a => a.severity === 'LOW').length,
      byType: Object.keys(groupedAnomalies).map(type => ({
        type,
        count: groupedAnomalies[type].length,
        highSeverity: groupedAnomalies[type].filter(a => a.severity === 'HIGH').length
      }))
    };
    
    // Generate recommendations
    const recommendations = generateAnomalyRecommendations(anomalyData.anomalies);
    
    return {
      summary,
      anomalies: anomalyData.anomalies,
      recommendations,
      period: anomalyData.period
    };
  } catch (error) {
    logger.error('Error in generateAnomalyReport:', error);
    throw error;
  }
};

/**
 * Generate recommendations based on anomalies
 * @param {Array} anomalies - Detected anomalies
 * @returns {Array} Recommendations
 */
const generateAnomalyRecommendations = (anomalies) => {
  const recommendations = [];
  
  // Check for duplicate transactions
  const duplicateAnomalies = anomalies.filter(a => a.type === 'POTENTIAL_DUPLICATE_TRANSACTION');
  if (duplicateAnomalies.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      recommendation: 'Review potential duplicate transactions',
      description: `Found ${duplicateAnomalies.length} potential duplicate transactions. Review these transactions and contact your bank if necessary.`,
      actionItems: [
        'Compare transaction details for similarities',
        'Check bank statements for confirmation',
        'Request refunds for any confirmed duplicates'
      ]
    });
  }
  
  // Check for overdue invoices
  const overdueAnomalies = anomalies.filter(a => a.type === 'LONG_OVERDUE_INVOICE');
  if (overdueAnomalies.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      recommendation: 'Address long overdue invoices',
      description: `Found ${overdueAnomalies.length} invoices that are significantly overdue. Take immediate action to collect these payments.`,
      actionItems: [
        'Contact customers with overdue invoices',
        'Consider offering payment plans',
        'Review credit terms for these customers',
        'Implement stricter credit control procedures'
      ]
    });
  }
  
  // Check for margin decline
  const marginAnomalies = anomalies.filter(a => 
    a.type === 'GROSS_MARGIN_DECLINE' || a.type === 'NET_MARGIN_DECLINE'
  );
  if (marginAnomalies.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      recommendation: 'Investigate profit margin decline',
      description: 'Significant decline in profit margins detected. Review pricing strategy and cost structure.',
      actionItems: [
        'Analyze cost of goods sold for increases',
        'Review pricing strategy',
        'Identify specific products or services with margin erosion',
        'Evaluate supplier contracts and negotiate better terms'
      ]
    });
  }
  
  // Check for unusual expenses
  const expenseAnomalies = anomalies.filter(a => a.type === 'UNUSUAL_EXPENSE_PATTERN');
  if (expenseAnomalies.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      recommendation: 'Review unusual expense patterns',
      description: `Found unusual spending patterns in ${expenseAnomalies.length} expense categories. Review these expenses for potential issues.`,
      actionItems: [
        'Audit expense categories with unusual patterns',
        'Implement approval processes for large expenses',
        'Review vendor contracts in affected categories',
        'Consider setting budget alerts for these categories'
      ]
    });
  }
  
  return recommendations;
};

module.exports = {
  detectAnomalies,
  generateAnomalyReport
};
