/**
 * KPI Calculation Service
 * Handles calculation of key performance indicators for financial analysis
 */

const { getProfitAndLoss, getBalanceSheet, getAgedReceivables, getAgedPayables } = require('../xero/reportsService');
const { getInvoices } = require('../xero/invoicesService');
const { getBills } = require('../xero/billsService');
const { getBankTransactions } = require('../xero/bankTransactionsService');
const logger = require('../../utils/logger');

/**
 * Calculate key financial ratios
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for calculation
 * @returns {Object} Financial ratios
 */
const calculateFinancialRatios = async (userId, tenantId, options = {}) => {
  try {
    // Get date range
    const toDate = options.toDate || new Date();
    const fromDate = new Date(toDate);
    fromDate.setMonth(fromDate.getMonth() - (options.months || 3));
    
    // Format dates for Xero API
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];
    
    // Get profit and loss report
    const profitLoss = await getProfitAndLoss(userId, tenantId, {
      fromDate: fromDateStr,
      toDate: toDateStr
    });
    
    // Get balance sheet
    const balanceSheet = await getBalanceSheet(userId, tenantId, {
      date: toDateStr
    });
    
    // Get aged receivables
    const agedReceivables = await getAgedReceivables(userId, tenantId, {
      date: toDateStr
    });
    
    // Get aged payables
    const agedPayables = await getAgedPayables(userId, tenantId, {
      date: toDateStr
    });
    
    // Extract key figures from reports
    const revenue = extractFromReport(profitLoss, 'Revenue');
    const costOfSales = extractFromReport(profitLoss, 'Cost of Sales');
    const grossProfit = extractFromReport(profitLoss, 'Gross Profit');
    const expenses = extractFromReport(profitLoss, 'Total Expenses');
    const netProfit = extractFromReport(profitLoss, 'Net Profit');
    
    const currentAssets = extractFromReport(balanceSheet, 'Total Current Assets');
    const totalAssets = extractFromReport(balanceSheet, 'Total Assets');
    const currentLiabilities = extractFromReport(balanceSheet, 'Total Current Liabilities');
    const totalLiabilities = extractFromReport(balanceSheet, 'Total Liabilities');
    const equity = extractFromReport(balanceSheet, 'Total Equity');
    
    const accountsReceivable = extractFromReport(balanceSheet, 'Accounts Receivable');
    const accountsPayable = extractFromReport(balanceSheet, 'Accounts Payable');
    const inventory = extractFromReport(balanceSheet, 'Inventory');
    
    // Calculate ratios
    const ratios = {
      // Profitability ratios
      grossProfitMargin: revenue !== 0 ? (grossProfit / revenue) * 100 : 0,
      netProfitMargin: revenue !== 0 ? (netProfit / revenue) * 100 : 0,
      returnOnAssets: totalAssets !== 0 ? (netProfit / totalAssets) * 100 : 0,
      returnOnEquity: equity !== 0 ? (netProfit / equity) * 100 : 0,
      
      // Liquidity ratios
      currentRatio: currentLiabilities !== 0 ? currentAssets / currentLiabilities : 0,
      quickRatio: currentLiabilities !== 0 ? (currentAssets - inventory) / currentLiabilities : 0,
      cashRatio: currentLiabilities !== 0 ? extractFromReport(balanceSheet, 'Bank') / currentLiabilities : 0,
      
      // Efficiency ratios
      assetTurnover: totalAssets !== 0 ? revenue / totalAssets : 0,
      inventoryTurnover: inventory !== 0 ? costOfSales / inventory : 0,
      receivablesTurnover: accountsReceivable !== 0 ? revenue / accountsReceivable : 0,
      payablesTurnover: accountsPayable !== 0 ? costOfSales / accountsPayable : 0,
      
      // Solvency ratios
      debtToEquity: equity !== 0 ? totalLiabilities / equity : 0,
      debtToAssets: totalAssets !== 0 ? totalLiabilities / totalAssets : 0,
      interestCoverage: extractFromReport(profitLoss, 'Interest Expense') !== 0 ? 
        netProfit / extractFromReport(profitLoss, 'Interest Expense') : 0,
      
      // Cash flow ratios
      operatingCashFlowRatio: currentLiabilities !== 0 ? 
        extractFromReport(profitLoss, 'Operating Cash Flow', 0) / currentLiabilities : 0
    };
    
    // Add days calculations
    const daysReceivables = accountsReceivable !== 0 ? (accountsReceivable / revenue) * 365 : 0;
    const daysPayables = accountsPayable !== 0 ? (accountsPayable / costOfSales) * 365 : 0;
    const daysInventory = inventory !== 0 ? (inventory / costOfSales) * 365 : 0;
    
    // Cash conversion cycle
    const cashConversionCycle = daysReceivables + daysInventory - daysPayables;
    
    // Add to ratios
    ratios.daysReceivables = daysReceivables;
    ratios.daysPayables = daysPayables;
    ratios.daysInventory = daysInventory;
    ratios.cashConversionCycle = cashConversionCycle;
    
    // Add raw data for reference
    const rawData = {
      revenue,
      costOfSales,
      grossProfit,
      expenses,
      netProfit,
      currentAssets,
      totalAssets,
      currentLiabilities,
      totalLiabilities,
      equity,
      accountsReceivable,
      accountsPayable,
      inventory
    };
    
    return {
      ratios,
      rawData,
      period: {
        fromDate: fromDateStr,
        toDate: toDateStr
      }
    };
  } catch (error) {
    logger.error('Error in calculateFinancialRatios:', error);
    throw error;
  }
};

/**
 * Extract value from financial report
 * @param {Object} report - Financial report
 * @param {string} lineItemName - Line item name to extract
 * @param {number} defaultValue - Default value if not found
 * @returns {number} Extracted value
 */
const extractFromReport = (report, lineItemName, defaultValue = 0) => {
  try {
    // This is a simplified extraction function
    // In a real implementation, we would need to traverse the report structure
    // based on the specific format of Xero reports
    
    // For now, we'll just search for the line item by name
    if (!report || !report.rows) {
      return defaultValue;
    }
    
    for (const row of report.rows) {
      if (row.cells && row.cells.length > 1) {
        const title = row.cells[0].value;
        if (title === lineItemName) {
          // Return the value from the last cell (usually the total)
          const valueCell = row.cells[row.cells.length - 1];
          return parseFloat(valueCell.value) || defaultValue;
        }
      }
    }
    
    return defaultValue;
  } catch (error) {
    logger.error(`Error extracting ${lineItemName} from report:`, error);
    return defaultValue;
  }
};

/**
 * Calculate business health score
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for calculation
 * @returns {Object} Business health score
 */
const calculateBusinessHealthScore = async (userId, tenantId, options = {}) => {
  try {
    // Get financial ratios
    const financialData = await calculateFinancialRatios(userId, tenantId, options);
    const { ratios } = financialData;
    
    // Define scoring weights
    const weights = {
      profitability: 0.3,
      liquidity: 0.25,
      efficiency: 0.2,
      solvency: 0.15,
      growth: 0.1
    };
    
    // Calculate profitability score (0-100)
    const profitabilityScore = calculateWeightedScore({
      grossProfitMargin: { value: ratios.grossProfitMargin, weight: 0.3, benchmark: 40, min: 0, max: 80 },
      netProfitMargin: { value: ratios.netProfitMargin, weight: 0.4, benchmark: 10, min: -10, max: 30 },
      returnOnAssets: { value: ratios.returnOnAssets, weight: 0.15, benchmark: 5, min: 0, max: 15 },
      returnOnEquity: { value: ratios.returnOnEquity, weight: 0.15, benchmark: 15, min: 0, max: 30 }
    });
    
    // Calculate liquidity score (0-100)
    const liquidityScore = calculateWeightedScore({
      currentRatio: { value: ratios.currentRatio, weight: 0.4, benchmark: 2, min: 0.5, max: 3 },
      quickRatio: { value: ratios.quickRatio, weight: 0.4, benchmark: 1, min: 0.3, max: 2 },
      cashRatio: { value: ratios.cashRatio, weight: 0.2, benchmark: 0.5, min: 0.1, max: 1 }
    });
    
    // Calculate efficiency score (0-100)
    const efficiencyScore = calculateWeightedScore({
      assetTurnover: { value: ratios.assetTurnover, weight: 0.2, benchmark: 2, min: 0.5, max: 4 },
      inventoryTurnover: { value: ratios.inventoryTurnover, weight: 0.2, benchmark: 6, min: 2, max: 12 },
      daysReceivables: { 
        value: ratios.daysReceivables, 
        weight: 0.3, 
        benchmark: 30, 
        min: 90, 
        max: 0,
        inverse: true // Lower is better
      },
      daysPayables: { 
        value: ratios.daysPayables, 
        weight: 0.3, 
        benchmark: 45, 
        min: 15, 
        max: 60
      }
    });
    
    // Calculate solvency score (0-100)
    const solvencyScore = calculateWeightedScore({
      debtToEquity: { 
        value: ratios.debtToEquity, 
        weight: 0.4, 
        benchmark: 1, 
        min: 3, 
        max: 0,
        inverse: true // Lower is better
      },
      debtToAssets: { 
        value: ratios.debtToAssets, 
        weight: 0.4, 
        benchmark: 0.5, 
        min: 1, 
        max: 0,
        inverse: true // Lower is better
      },
      interestCoverage: { value: ratios.interestCoverage, weight: 0.2, benchmark: 3, min: 1, max: 10 }
    });
    
    // Growth score would normally be calculated based on historical data
    // For simplicity, we'll use a placeholder value
    const growthScore = 50;
    
    // Calculate overall health score
    const overallScore = (
      profitabilityScore * weights.profitability +
      liquidityScore * weights.liquidity +
      efficiencyScore * weights.efficiency +
      solvencyScore * weights.solvency +
      growthScore * weights.growth
    );
    
    // Determine health status
    let healthStatus;
    if (overallScore >= 80) {
      healthStatus = 'EXCELLENT';
    } else if (overallScore >= 65) {
      healthStatus = 'GOOD';
    } else if (overallScore >= 50) {
      healthStatus = 'FAIR';
    } else if (overallScore >= 35) {
      healthStatus = 'CONCERNING';
    } else {
      healthStatus = 'CRITICAL';
    }
    
    // Generate recommendations based on scores
    const recommendations = generateRecommendations({
      profitabilityScore,
      liquidityScore,
      efficiencyScore,
      solvencyScore,
      growthScore,
      ratios
    });
    
    return {
      overallScore: Math.round(overallScore),
      healthStatus,
      componentScores: {
        profitability: Math.round(profitabilityScore),
        liquidity: Math.round(liquidityScore),
        efficiency: Math.round(efficiencyScore),
        solvency: Math.round(solvencyScore),
        growth: Math.round(growthScore)
      },
      ratios,
      recommendations,
      period: financialData.period
    };
  } catch (error) {
    logger.error('Error in calculateBusinessHealthScore:', error);
    throw error;
  }
};

/**
 * Calculate weighted score for a set of metrics
 * @param {Object} metrics - Metrics with weights and benchmarks
 * @returns {number} Weighted score (0-100)
 */
const calculateWeightedScore = (metrics) => {
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const [key, metric] of Object.entries(metrics)) {
    const { value, weight, benchmark, min, max, inverse = false } = metric;
    
    // Skip if value is undefined or null
    if (value === undefined || value === null) {
      continue;
    }
    
    // Calculate score (0-100)
    let score;
    if (inverse) {
      // For inverse metrics (lower is better)
      if (value <= max) {
        score = 100;
      } else if (value >= min) {
        score = 0;
      } else {
        score = 100 * (min - value) / (min - max);
      }
    } else {
      // For regular metrics (higher is better)
      if (value >= max) {
        score = 100;
      } else if (value <= min) {
        score = 0;
      } else {
        score = 100 * (value - min) / (max - min);
      }
    }
    
    totalScore += score * weight;
    totalWeight += weight;
  }
  
  // Return weighted average score
  return totalWeight > 0 ? totalScore / totalWeight : 50;
};

/**
 * Generate recommendations based on financial scores
 * @param {Object} scores - Component scores and ratios
 * @returns {Array} List of recommendations
 */
const generateRecommendations = (scores) => {
  const recommendations = [];
  const { profitabilityScore, liquidityScore, efficiencyScore, solvencyScore, ratios } = scores;
  
  // Profitability recommendations
  if (profitabilityScore < 40) {
    if (ratios.grossProfitMargin < 20) {
      recommendations.push({
        category: 'Profitability',
        issue: 'Low gross profit margin',
        recommendation: 'Review pricing strategy and cost of goods sold. Consider increasing prices or negotiating better terms with suppliers.'
      });
    }
    
    if (ratios.netProfitMargin < 5) {
      recommendations.push({
        category: 'Profitability',
        issue: 'Low net profit margin',
        recommendation: 'Analyze operating expenses and identify areas for cost reduction. Focus on improving operational efficiency.'
      });
    }
  }
  
  // Liquidity recommendations
  if (liquidityScore < 50) {
    if (ratios.currentRatio < 1.2) {
      recommendations.push({
        category: 'Liquidity',
        issue: 'Low current ratio',
        recommendation: 'Improve working capital management. Consider extending payment terms with suppliers, accelerating customer payments, or reducing inventory levels.'
      });
    }
    
    if (ratios.quickRatio < 0.8) {
      recommendations.push({
        category: 'Liquidity',
        issue: 'Low quick ratio',
        recommendation: 'Focus on improving cash position. Consider invoice factoring, reducing credit terms for customers, or establishing a line of credit.'
      });
    }
  }
  
  // Efficiency recommendations
  if (efficiencyScore < 50) {
    if (ratios.daysReceivables > 45) {
      recommendations.push({
        category: 'Efficiency',
        issue: 'High days sales outstanding',
        recommendation: 'Improve accounts receivable management. Implement stricter credit policies, offer early payment discounts, or follow up on overdue invoices more aggressively.'
      });
    }
    
    if (ratios.daysInventory > 60) {
      recommendations.push({
        category: 'Efficiency',
        issue: 'High inventory days',
        recommendation: 'Optimize inventory management. Implement just-in-time inventory practices, identify slow-moving items, or consider drop-shipping for certain products.'
      });
    }
  }
  
  // Solvency recommendations
  if (solvencyScore < 50) {
    if (ratios.debtToEquity > 2) {
      recommendations.push({
        category: 'Solvency',
        issue: 'High debt-to-equity ratio',
        recommendation: 'Reduce debt levels. Consider debt consolidation, equity financing, or selling non-essential assets to pay down debt.'
      });
    }
    
    if (ratios.interestCoverage < 2) {
      recommendations.push({
        category: 'Solvency',
        issue: 'Low interest coverage ratio',
        recommendation: 'Improve ability to service debt. Focus on increasing operating income or refinancing debt at lower interest rates.'
      });
    }
  }
  
  // Cash flow recommendations
  if (ratios.cashConversionCycle > 60) {
    recommendations.push({
      category: 'Cash Flow',
      issue: 'Long cash conversion cycle',
      recommendation: 'Optimize working capital cycle. Reduce inventory holding period, accelerate customer payments, and negotiate better terms with suppliers.'
    });
  }
  
  return recommendations;
};

/**
 * Calculate key performance indicators
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for calculation
 * @returns {Object} Key performance indicators
 */
const calculateKPIs = async (userId, tenantId, options = {}) => {
  try {
    // Get financial ratios and health score
    const healthScore = await calculateBusinessHealthScore(userId, tenantId, options);
    
    // Get date range
    const toDate = options.toDate || new Date();
    const fromDate = new Date(toDate);
    fromDate.setMonth(fromDate.getMonth() - (options.months || 3));
    
    // Format dates for Xero API
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];
    
    // Get invoices for revenue KPIs
    const invoices = await getInvoices(userId, tenantId, {
      where: `Date >= DateTime(${fromDateStr}) && Date <= DateTime(${toDateStr}) && Type=="ACCREC"`,
      page: 1,
      pageSize: 100
    });
    
    // Calculate revenue KPIs
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidRevenue = invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.total, 0);
    const unpaidRevenue = totalRevenue - paidRevenue;
    
    // Calculate average invoice value
    const avgInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;
    
    // Get bills for expense KPIs
    const bills = await getBills(userId, tenantId, {
      where: `Date >= DateTime(${fromDateStr}) && Date <= DateTime(${toDateStr})`,
      page: 1,
      pageSize: 100
    });
    
    // Calculate expense KPIs
    const totalExpenses = bills.reduce((sum, bill) => sum + bill.total, 0);
    
    // Compile KPIs
    const kpis = {
      financial: {
        grossProfitMargin: healthScore.ratios.grossProfitMargin,
        netProfitMargin: healthScore.ratios.netProfitMargin,
        currentRatio: healthScore.ratios.currentRatio,
        quickRatio: healthScore.ratios.quickRatio,
        debtToEquity: healthScore.ratios.debtToEquity,
        returnOnEquity: healthScore.ratios.returnOnEquity
      },
      revenue: {
        totalRevenue,
        paidRevenue,
        unpaidRevenue,
        collectionRate: totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0,
        avgInvoiceValue
      },
      expenses: {
        totalExpenses,
        expenseToRevenueRatio: totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0
      },
      efficiency: {
        daysReceivables: healthScore.ratios.daysReceivables,
        daysPayables: healthScore.ratios.daysPayables,
        daysInventory: healthScore.ratios.daysInventory,
        cashConversionCycle: healthScore.ratios.cashConversionCycle
      },
      health: {
        overallScore: healthScore.overallScore,
        healthStatus: healthScore.healthStatus,
        componentScores: healthScore.componentScores
      }
    };
    
    return {
      kpis,
      period: {
        fromDate: fromDateStr,
        toDate: toDateStr
      },
      recommendations: healthScore.recommendations
    };
  } catch (error) {
    logger.error('Error in calculateKPIs:', error);
    throw error;
  }
};

module.exports = {
  calculateFinancialRatios,
  calculateBusinessHealthScore,
  calculateKPIs
};
