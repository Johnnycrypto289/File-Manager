/**
 * Webhook Routes
 * Routes for webhook registration and handling
 */

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { authenticate } = require('../middleware/auth');

// Xero webhook endpoint (no authentication required)
router.post('/xero', webhookController.handleXeroWebhook);

// Apply authentication middleware to all other routes
router.use(authenticate);

// Webhook management endpoints
router.post('/register', webhookController.registerWebhook);
router.get('/list', webhookController.listWebhooks);
router.put('/:webhookId', webhookController.updateWebhook);
router.delete('/:webhookId', webhookController.deleteWebhook);
router.post('/:webhookId/regenerate-secret', webhookController.regenerateWebhookSecret);
router.post('/:webhookId/test', webhookController.testWebhook);

module.exports = router;
