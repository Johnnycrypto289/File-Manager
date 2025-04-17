/**
 * Webhook Controller
 * Handles webhook events for integration with external systems
 */

const Webhook = require('../models/Webhook');
const Transaction = require('../models/Transaction');
const { syncBankTransactions } = require('../services/bookkeeping/reconciliationService');
const { applyCategorizationRules } = require('../services/bookkeeping/categorizationService');
const { syncInvoices } = require('../services/bookkeeping/invoiceService');
const { syncPayments } = require('../services/bookkeeping/paymentService');
const { detectAnomalies } = require('../services/analysis/anomalyService');
const { detectCashFlowIssues } = require('../services/analysis/cashFlowService');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');
const crypto = require('crypto');
const axios = require('axios');

/**
 * Register a new webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerWebhook = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { name, description, event, url, headers } = req.body;
    
    if (!name || !event || !url) {
      return errorResponse(res, 'Name, event, and URL are required', 400);
    }
    
    // Create webhook
    const webhook = await Webhook.create({
      userId,
      tenantId,
      name,
      description,
      event,
      url,
      headers: headers || {},
      isActive: true
    });
    
    logger.info(`Registered webhook ${webhook.id} for event ${event}`);
    
    return successResponse(res, {
      message: 'Webhook registered successfully',
      webhook: {
        id: webhook.id,
        name: webhook.name,
        event: webhook.event,
        url: webhook.url,
        secret: webhook.secret
      }
    });
  } catch (error) {
    logger.error('Error in registerWebhook:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * List registered webhooks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const listWebhooks = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    
    const webhooks = await Webhook.findAll({
      where: {
        userId,
        tenantId
      },
      attributes: ['id', 'name', 'description', 'event', 'url', 'isActive', 'lastTriggeredAt', 'successCount', 'failureCount']
    });
    
    return successResponse(res, webhooks);
  } catch (error) {
    logger.error('Error in listWebhooks:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateWebhook = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { webhookId } = req.params;
    const { name, description, event, url, headers, isActive } = req.body;
    
    // Find webhook
    const webhook = await Webhook.findOne({
      where: {
        id: webhookId,
        userId,
        tenantId
      }
    });
    
    if (!webhook) {
      return errorResponse(res, 'Webhook not found', 404);
    }
    
    // Update webhook
    await webhook.update({
      name: name || webhook.name,
      description: description !== undefined ? description : webhook.description,
      event: event || webhook.event,
      url: url || webhook.url,
      headers: headers || webhook.headers,
      isActive: isActive !== undefined ? isActive : webhook.isActive
    });
    
    logger.info(`Updated webhook ${webhookId}`);
    
    return successResponse(res, {
      message: 'Webhook updated successfully',
      webhook: {
        id: webhook.id,
        name: webhook.name,
        event: webhook.event,
        url: webhook.url,
        isActive: webhook.isActive
      }
    });
  } catch (error) {
    logger.error('Error in updateWebhook:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Delete webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteWebhook = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { webhookId } = req.params;
    
    // Find webhook
    const webhook = await Webhook.findOne({
      where: {
        id: webhookId,
        userId,
        tenantId
      }
    });
    
    if (!webhook) {
      return errorResponse(res, 'Webhook not found', 404);
    }
    
    // Delete webhook
    await webhook.destroy();
    
    logger.info(`Deleted webhook ${webhookId}`);
    
    return successResponse(res, {
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteWebhook:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Regenerate webhook secret
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const regenerateWebhookSecret = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { webhookId } = req.params;
    
    // Find webhook
    const webhook = await Webhook.findOne({
      where: {
        id: webhookId,
        userId,
        tenantId
      }
    });
    
    if (!webhook) {
      return errorResponse(res, 'Webhook not found', 404);
    }
    
    // Generate new secret
    const newSecret = crypto.randomBytes(32).toString('hex');
    
    // Update webhook
    await webhook.update({
      secret: newSecret
    });
    
    logger.info(`Regenerated secret for webhook ${webhookId}`);
    
    return successResponse(res, {
      message: 'Webhook secret regenerated successfully',
      webhook: {
        id: webhook.id,
        name: webhook.name,
        secret: newSecret
      }
    });
  } catch (error) {
    logger.error('Error in regenerateWebhookSecret:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Handle Xero webhook events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleXeroWebhook = async (req, res) => {
  try {
    // Verify Xero webhook signature
    const xeroSignature = req.headers['x-xero-signature'];
    
    if (!xeroSignature) {
      logger.warn('Missing Xero webhook signature');
      return errorResponse(res, 'Missing signature', 401);
    }
    
    // TODO: Implement proper signature verification
    // This would require the webhook secret from Xero
    
    // Process webhook event
    const event = req.body;
    
    if (!event || !event.events) {
      return errorResponse(res, 'Invalid event format', 400);
    }
    
    // Process each event
    for (const eventItem of event.events) {
      await processXeroEvent(eventItem);
    }
    
    return successResponse(res, {
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    logger.error('Error in handleXeroWebhook:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Process Xero event
 * @param {Object} event - Xero event object
 */
const processXeroEvent = async (event) => {
  try {
    const { tenantId, eventType, resourceId } = event;
    
    logger.info(`Processing Xero event: ${eventType} for tenant ${tenantId}`);
    
    // Find users with this tenant
    const users = await User.findAll({
      include: [{
        model: XeroTenant,
        where: {
          tenantId: tenantId
        }
      }]
    });
    
    if (users.length === 0) {
      logger.warn(`No users found for tenant ${tenantId}`);
      return;
    }
    
    // Process event for each user
    for (const user of users) {
      const userId = user.id;
      
      switch (eventType) {
        case 'INVOICE_CREATED':
        case 'INVOICE_UPDATED':
          await syncInvoices(userId, tenantId, { days: 7 });
          break;
        
        case 'PAYMENT_CREATED':
          await syncPayments(userId, tenantId, { days: 7 });
          break;
        
        case 'BANK_TRANSACTION_CREATED':
        case 'BANK_TRANSACTION_UPDATED':
          await syncBankTransactions(userId, tenantId, { days: 7 });
          await applyCategorizationRules(userId, tenantId);
          break;
        
        default:
          logger.info(`Unhandled event type: ${eventType}`);
      }
      
      // Trigger user webhooks
      await triggerUserWebhooks(userId, tenantId, eventType, {
        eventType,
        resourceId,
        tenantId
      });
    }
  } catch (error) {
    logger.error('Error in processXeroEvent:', error);
    throw error;
  }
};

/**
 * Trigger user webhooks
 * @param {string} userId - User ID
 * @param {string} tenantId - Tenant ID
 * @param {string} eventType - Event type
 * @param {Object} payload - Event payload
 */
const triggerUserWebhooks = async (userId, tenantId, eventType, payload) => {
  try {
    // Find matching webhooks
    const webhooks = await Webhook.findAll({
      where: {
        userId,
        tenantId,
        event: eventType,
        isActive: true
      }
    });
    
    if (webhooks.length === 0) {
      return;
    }
    
    logger.info(`Triggering ${webhooks.length} webhooks for event ${eventType}`);
    
    // Trigger each webhook
    for (const webhook of webhooks) {
      try {
        // Generate signature
        const signature = generateWebhookSignature(payload, webhook.secret);
        
        // Prepare headers
        const headers = {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          ...webhook.headers
        };
        
        // Send webhook
        const response = await axios.post(webhook.url, payload, { headers });
        
        // Update webhook stats
        await webhook.update({
          lastTriggeredAt: new Date(),
          successCount: webhook.successCount + 1
        });
        
        logger.info(`Webhook ${webhook.id} triggered successfully`);
      } catch (error) {
        // Update webhook stats
        await webhook.update({
          lastTriggeredAt: new Date(),
          failureCount: webhook.failureCount + 1,
          lastError: error.message
        });
        
        logger.error(`Error triggering webhook ${webhook.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in triggerUserWebhooks:', error);
    throw error;
  }
};

/**
 * Generate webhook signature
 * @param {Object} payload - Webhook payload
 * @param {string} secret - Webhook secret
 * @returns {string} Signature
 */
const generateWebhookSignature = (payload, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
};

/**
 * Manually trigger webhook for testing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const testWebhook = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { webhookId } = req.params;
    const { payload } = req.body;
    
    // Find webhook
    const webhook = await Webhook.findOne({
      where: {
        id: webhookId,
        userId,
        tenantId
      }
    });
    
    if (!webhook) {
      return errorResponse(res, 'Webhook not found', 404);
    }
    
    // Generate test payload if not provided
    const testPayload = payload || {
      event: webhook.event,
      timestamp: new Date().toISOString(),
      tenantId,
      test: true
    };
    
    // Generate signature
    const signature = generateWebhookSignature(testPayload, webhook.secret);
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      ...webhook.headers
    };
    
    // Send webhook
    const response = await axios.post(webhook.url, testPayload, { headers });
    
    // Update webhook stats
    await webhook.update({
      lastTriggeredAt: new Date(),
      successCount: webhook.successCount + 1
    });
    
    logger.info(`Test webhook ${webhookId} triggered successfully`);
    
    return successResponse(res, {
      message: 'Test webhook triggered successfully',
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    logger.error('Error in testWebhook:', error);
    
    // Update webhook stats if webhook exists
    if (req.params.webhookId) {
      try {
        const webhook = await Webhook.findByPk(req.params.webhookId);
        if (webhook) {
          await webhook.update({
            lastTriggeredAt: new Date(),
            failureCount: webhook.failureCount + 1,
            lastError: error.message
          });
        }
      } catch (updateError) {
        logger.error('Error updating webhook stats:', updateError);
      }
    }
    
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  registerWebhook,
  listWebhooks,
  updateWebhook,
  deleteWebhook,
  regenerateWebhookSecret,
  handleXeroWebhook,
  testWebhook
};
