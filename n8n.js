/**
 * n8n API Routes
 * Routes for n8n integration endpoints
 */

const express = require('express');
const router = express.Router();
const n8nController = require('../controllers/n8nController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Financial analysis endpoints
router.get('/kpis', n8nController.getFinancialKPIs);
router.get('/cash-flow/forecast', n8nController.getCashFlowForecast);
router.get('/cash-flow/issues', n8nController.getCashFlowIssues);
router.get('/anomalies', n8nController.getFinancialAnomalies);

// Transaction management endpoints
router.post('/transactions/sync', n8nController.syncTransactions);
router.get('/transactions/:transactionId/matches', n8nController.getTransactionMatches);
router.post('/transactions/categorize', n8nController.applyCategorization);

// Invoice management endpoints
router.get('/invoices/overdue', n8nController.getOverdueInvoicesEndpoint);
router.get('/contacts/:contactId/payment-reminder', n8nController.generatePaymentReminderEndpoint);
router.post('/contacts/:contactId/payment-reminder', n8nController.sendPaymentReminderEndpoint);

// Bill management endpoints
router.get('/bills/upcoming', n8nController.getUpcomingBillPaymentsEndpoint);
router.get('/bills/payment-schedule', n8nController.generatePaymentScheduleEndpoint);

module.exports = router;
