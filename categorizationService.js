/**
 * Transaction Categorization Service
 * Handles automatic and manual categorization of transactions
 */

const Transaction = require('../../models/Transaction');
const Category = require('../../models/Category');
const CategoryRule = require('../../models/CategoryRule');
const logger = require('../../utils/logger');
const { Op } = require('sequelize');

/**
 * Get all categories for a tenant
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @returns {Array} List of categories
 */
const getCategories = async (userId, tenantId) => {
  try {
    const categories = await Category.findAll({
      where: {
        userId,
        tenantId,
        isActive: true
      },
      order: [['name', 'ASC']]
    });
    
    return categories;
  } catch (error) {
    logger.error('Error in getCategories:', error);
    throw error;
  }
};

/**
 * Create a new category
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} categoryData - Category data
 * @returns {Object} Created category
 */
const createCategory = async (userId, tenantId, categoryData) => {
  try {
    const category = await Category.create({
      userId,
      tenantId,
      name: categoryData.name,
      description: categoryData.description,
      accountId: categoryData.accountId,
      accountCode: categoryData.accountCode,
      accountName: categoryData.accountName,
      type: categoryData.type,
      color: categoryData.color,
      icon: categoryData.icon,
      parentId: categoryData.parentId,
      metadata: categoryData.metadata
    });
    
    return category;
  } catch (error) {
    logger.error('Error in createCategory:', error);
    throw error;
  }
};

/**
 * Get all category rules for a tenant
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @returns {Array} List of category rules
 */
const getCategoryRules = async (userId, tenantId) => {
  try {
    const rules = await CategoryRule.findAll({
      where: {
        userId,
        tenantId,
        isActive: true
      },
      order: [['priority', 'ASC']]
    });
    
    return rules;
  } catch (error) {
    logger.error('Error in getCategoryRules:', error);
    throw error;
  }
};

/**
 * Create a new category rule
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} ruleData - Rule data
 * @returns {Object} Created rule
 */
const createCategoryRule = async (userId, tenantId, ruleData) => {
  try {
    // Validate category exists
    const category = await Category.findOne({
      where: {
        id: ruleData.categoryId,
        userId,
        tenantId,
        isActive: true
      }
    });
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    // Create rule
    const rule = await CategoryRule.create({
      userId,
      tenantId,
      categoryId: ruleData.categoryId,
      name: ruleData.name,
      description: ruleData.description,
      conditions: ruleData.conditions,
      priority: ruleData.priority || 100,
      isAutomatic: ruleData.isAutomatic !== undefined ? ruleData.isAutomatic : true
    });
    
    return rule;
  } catch (error) {
    logger.error('Error in createCategoryRule:', error);
    throw error;
  }
};

/**
 * Apply category rules to uncategorized transactions
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for categorization
 * @returns {Object} Categorization results
 */
const applyCategorizationRules = async (userId, tenantId, options = {}) => {
  try {
    // Get active rules
    const rules = await CategoryRule.findAll({
      where: {
        userId,
        tenantId,
        isActive: true,
        isAutomatic: true
      },
      order: [['priority', 'ASC']]
    });
    
    if (rules.length === 0) {
      return { categorized: 0, total: 0 };
    }
    
    // Get uncategorized transactions
    const transactions = await Transaction.findAll({
      where: {
        userId,
        tenantId,
        categoryId: null,
        status: {
          [Op.ne]: 'VOIDED'
        }
      },
      limit: options.limit || 100
    });
    
    if (transactions.length === 0) {
      return { categorized: 0, total: 0 };
    }
    
    // Apply rules to transactions
    let categorizedCount = 0;
    
    for (const transaction of transactions) {
      // Find matching rule
      const matchingRule = findMatchingRule(transaction, rules);
      
      if (matchingRule) {
        // Apply category
        await transaction.update({
          categoryId: matchingRule.categoryId,
          status: 'CATEGORIZED',
          metadata: {
            ...transaction.metadata,
            categorization: {
              ruleId: matchingRule.id,
              ruleName: matchingRule.name,
              categoryId: matchingRule.categoryId,
              date: new Date()
            }
          }
        });
        
        // Update rule stats
        await matchingRule.update({
          matchCount: matchingRule.matchCount + 1,
          lastMatchedAt: new Date()
        });
        
        categorizedCount++;
      }
    }
    
    logger.info(`Applied categorization rules: ${categorizedCount}/${transactions.length} transactions categorized`);
    
    return {
      categorized: categorizedCount,
      total: transactions.length
    };
  } catch (error) {
    logger.error('Error in applyCategorizationRules:', error);
    throw error;
  }
};

/**
 * Find matching rule for a transaction
 * @param {Object} transaction - Transaction object
 * @param {Array} rules - List of category rules
 * @returns {Object|null} Matching rule or null
 */
const findMatchingRule = (transaction, rules) => {
  for (const rule of rules) {
    if (evaluateRuleConditions(transaction, rule.conditions)) {
      return rule;
    }
  }
  return null;
};

/**
 * Evaluate rule conditions against a transaction
 * @param {Object} transaction - Transaction object
 * @param {Array} conditions - List of condition objects
 * @returns {boolean} True if conditions match
 */
const evaluateRuleConditions = (transaction, conditions) => {
  // If no conditions, rule doesn't match
  if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
    return false;
  }
  
  // All conditions must match (AND logic)
  return conditions.every(condition => {
    const { field, operator, value } = condition;
    
    // Get field value from transaction
    let fieldValue;
    switch (field) {
      case 'description':
        fieldValue = transaction.description;
        break;
      case 'reference':
        fieldValue = transaction.reference;
        break;
      case 'amount':
        fieldValue = transaction.amount;
        break;
      case 'contactName':
        fieldValue = transaction.contactName;
        break;
      case 'accountName':
        fieldValue = transaction.accountName;
        break;
      default:
        // Try to get from metadata
        if (transaction.metadata && field.startsWith('metadata.')) {
          const metaField = field.substring(9);
          fieldValue = transaction.metadata[metaField];
        } else {
          fieldValue = transaction[field];
        }
    }
    
    // If field doesn't exist, condition doesn't match
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }
    
    // Evaluate based on operator
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(value.toLowerCase());
      case 'notContains':
        return typeof fieldValue === 'string' && !fieldValue.toLowerCase().includes(value.toLowerCase());
      case 'startsWith':
        return typeof fieldValue === 'string' && fieldValue.toLowerCase().startsWith(value.toLowerCase());
      case 'endsWith':
        return typeof fieldValue === 'string' && fieldValue.toLowerCase().endsWith(value.toLowerCase());
      case 'greaterThan':
        return typeof fieldValue === 'number' && fieldValue > value;
      case 'lessThan':
        return typeof fieldValue === 'number' && fieldValue < value;
      case 'greaterThanOrEqual':
        return typeof fieldValue === 'number' && fieldValue >= value;
      case 'lessThanOrEqual':
        return typeof fieldValue === 'number' && fieldValue <= value;
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'notIn':
        return Array.isArray(value) && !value.includes(fieldValue);
      default:
        return false;
    }
  });
};

/**
 * Manually categorize a transaction
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {string} transactionId - Transaction ID
 * @param {string} categoryId - Category ID
 * @returns {Object} Updated transaction
 */
const categorizeTransaction = async (userId, tenantId, transactionId, categoryId) => {
  try {
    // Validate category exists
    const category = await Category.findOne({
      where: {
        id: categoryId,
        userId,
        tenantId,
        isActive: true
      }
    });
    
    if (!category) {
      throw new Error('Category not found');
    }
    
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
    
    // Update transaction
    await transaction.update({
      categoryId,
      status: 'CATEGORIZED',
      metadata: {
        ...transaction.metadata,
        categorization: {
          categoryId,
          categoryName: category.name,
          date: new Date(),
          method: 'MANUAL'
        }
      }
    });
    
    logger.info(`Manually categorized transaction ${transactionId} with category ${categoryId}`);
    
    return transaction;
  } catch (error) {
    logger.error('Error in categorizeTransaction:', error);
    throw error;
  }
};

/**
 * Get categorization statistics
 * @param {string} userId - User ID
 * @param {string} tenantId - Xero tenant ID
 * @param {Object} options - Options for statistics
 * @returns {Object} Categorization statistics
 */
const getCategorizationStats = async (userId, tenantId, options = {}) => {
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
        status: {
          [Op.ne]: 'VOIDED'
        },
        date: {
          [Op.between]: [fromDate, toDate]
        }
      }
    });
    
    // Count categorized transactions
    const categorizedCount = await Transaction.count({
      where: {
        userId,
        tenantId,
        categoryId: {
          [Op.ne]: null
        },
        status: {
          [Op.ne]: 'VOIDED'
        },
        date: {
          [Op.between]: [fromDate, toDate]
        }
      }
    });
    
    // Calculate percentage
    const categorizedPercentage = totalCount > 0 
      ? Math.round((categorizedCount / totalCount) * 100) 
      : 0;
    
    // Get top categories
    const topCategories = await Transaction.findAll({
      attributes: [
        'categoryId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      where: {
        userId,
        tenantId,
        categoryId: {
          [Op.ne]: null
        },
        status: {
          [Op.ne]: 'VOIDED'
        },
        date: {
          [Op.between]: [fromDate, toDate]
        }
      },
      group: ['categoryId'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 5,
      include: [{
        model: Category,
        attributes: ['name', 'type', 'color']
      }]
    });
    
    return {
      totalTransactions: totalCount,
      categorizedTransactions: categorizedCount,
      uncategorizedTransactions: totalCount - categorizedCount,
      categorizedPercentage,
      topCategories: topCategories.map(tc => ({
        categoryId: tc.categoryId,
        name: tc.Category.name,
        type: tc.Category.type,
        color: tc.Category.color,
        count: tc.get('count'),
        total: tc.get('total')
      })),
      period: {
        fromDate,
        toDate,
        days
      }
    };
  } catch (error) {
    logger.error('Error in getCategorizationStats:', error);
    throw error;
  }
};

module.exports = {
  getCategories,
  createCategory,
  getCategoryRules,
  createCategoryRule,
  applyCategorizationRules,
  categorizeTransaction,
  getCategorizationStats
};
