# Xero Accounting & CFO Assistant Agent - n8n Integration Requirements

## 1. Overview

The n8n integration is a critical component of the Xero Agent system, enabling workflow automation for accounting tasks. This document outlines the requirements and specifications for integrating the Xero Agent with n8n, including API endpoints, webhooks, authentication, and pre-built workflow templates.

## 2. Integration Architecture

### 2.1 Communication Flow

```
┌─────────────┐     ┌───────────────┐     ┌──────────────┐
│    n8n      │     │  Xero Agent   │     │  Xero API    │
└────┬────────┘     └───────┬───────┘     └──────┬───────┘
     │                      │                    │
     │ HTTP Request         │                    │
     │ (Trigger Action)     │                    │
     │─────────────────────>│                    │
     │                      │                    │
     │                      │ API Call           │
     │                      │───────────────────>│
     │                      │                    │
     │                      │ Response           │
     │                      │<───────────────────│
     │                      │                    │
     │ Response             │                    │
     │<─────────────────────│                    │
     │                      │                    │
     │                      │ Webhook (Event)    │
     │<─────────────────────│                    │
     │                      │                    │
     │ Process Webhook      │                    │
     │ & Execute Workflow   │                    │
     │──────┐               │                    │
     │<─────┘               │                    │
```

### 2.2 Integration Methods

1. **REST API**: Xero Agent will expose REST API endpoints that n8n can call to trigger actions
2. **Webhooks**: Xero Agent will send webhooks to n8n when specific events occur
3. **Pre-built Workflows**: Xero Agent will provide templates for common n8n workflows

## 3. API Endpoint Requirements

### 3.1 Authentication Endpoints

| Endpoint | Method | Description | Parameters | Response |
|----------|--------|-------------|------------|----------|
| `/api/n8n/auth/verify` | POST | Verify n8n API key | `apiKey` | `{ "valid": true/false }` |
| `/api/n8n/auth/refresh` | POST | Refresh n8n API key | `apiKey` | `{ "apiKey": "new-key" }` |

### 3.2 Bookkeeping Endpoints

| Endpoint | Method | Description | Parameters | Response |
|----------|--------|-------------|------------|----------|
| `/api/n8n/reconcile` | POST | Trigger bank reconciliation | `accountId`, `dateFrom`, `dateTo` | Reconciliation results |
| `/api/n8n/categorize` | POST | Categorize transactions | `transactions` | Categorized transactions |
| `/api/n8n/invoices/create` | POST | Create invoice | Invoice details | Created invoice |
| `/api/n8n/invoices/send` | POST | Send invoice | `invoiceId`, `recipient` | Sending status |
| `/api/n8n/payments/create` | POST | Create payment | Payment details | Created payment |
| `/api/n8n/bills/create` | POST | Create bill | Bill details | Created bill |

### 3.3 Reporting Endpoints

| Endpoint | Method | Description | Parameters | Response |
|----------|--------|-------------|------------|----------|
| `/api/n8n/reports/pl` | GET | Get Profit & Loss report | `period`, `compareWith` | P&L report data |
| `/api/n8n/reports/balance-sheet` | GET | Get Balance Sheet | `asOf`, `compareWith` | Balance Sheet data |
| `/api/n8n/reports/cash-flow` | GET | Get Cash Flow report | `period`, `forecast` | Cash Flow data |
| `/api/n8n/reports/aged-receivables` | GET | Get Aged Receivables | `asOf` | Aged Receivables data |
| `/api/n8n/reports/aged-payables` | GET | Get Aged Payables | `asOf` | Aged Payables data |

### 3.4 Analysis Endpoints

| Endpoint | Method | Description | Parameters | Response |
|----------|--------|-------------|------------|----------|
| `/api/n8n/analysis/cash-forecast` | GET | Get cash flow forecast | `weeks`, `scenarios` | Forecast data |
| `/api/n8n/analysis/budget-variance` | GET | Get budget variance | `period` | Variance data |
| `/api/n8n/analysis/kpis` | GET | Get KPIs | `metrics` | KPI data |
| `/api/n8n/analysis/anomalies` | GET | Get detected anomalies | `period`, `threshold` | Anomalies list |

### 3.5 Management Endpoints

| Endpoint | Method | Description | Parameters | Response |
|----------|--------|-------------|------------|----------|
| `/api/n8n/tenants` | GET | List connected Xero tenants | None | Tenants list |
| `/api/n8n/status` | GET | Get system status | None | Status information |
| `/api/n8n/logs` | GET | Get operation logs | `limit`, `type` | Logs data |

## 4. Webhook Requirements

### 4.1 Webhook Configuration

- Xero Agent will need to store n8n webhook URLs for different event types
- Configuration interface to set up webhook destinations
- Authentication mechanism for webhook security (HMAC signatures)
- Retry logic for failed webhook deliveries

### 4.2 Webhook Event Types

| Event Type | Description | Payload |
|------------|-------------|---------|
| `reconciliation.completed` | Bank reconciliation completed | Reconciliation summary |
| `reconciliation.items_need_review` | Items need manual review | List of unreconciled items |
| `invoice.created` | New invoice created | Invoice details |
| `invoice.sent` | Invoice sent to customer | Sending details |
| `invoice.paid` | Invoice marked as paid | Payment details |
| `invoice.overdue` | Invoice is overdue | Invoice details |
| `bill.created` | New bill created | Bill details |
| `bill.due_soon` | Bill payment due soon | Bill details |
| `payment.received` | Payment received | Payment details |
| `payment.made` | Payment made | Payment details |
| `anomaly.detected` | Financial anomaly detected | Anomaly details |
| `cashflow.alert` | Cash flow alert triggered | Alert details |
| `report.generated` | Financial report generated | Report summary |

## 5. Authentication and Security Requirements

### 5.1 API Key Authentication

- n8n will authenticate to Xero Agent using API keys
- API keys should be generated and managed in the Xero Agent admin interface
- Keys should have configurable permissions and expiration
- Rate limiting should be implemented to prevent abuse

### 5.2 Webhook Security

- Webhooks should include HMAC signatures for verification
- Shared secret for HMAC should be configurable
- Timestamp validation to prevent replay attacks
- IP address validation (optional)

## 6. Pre-built n8n Workflow Templates

### 6.1 Daily Reconciliation Workflow

```
[Trigger: Schedule] → [HTTP Request to /api/n8n/reconcile] → [Decision: Success?] → [Email Notification if items need review]
```

- Runs daily at specified time
- Triggers bank reconciliation for all accounts
- Sends notification if items need manual review

### 6.2 Invoice Reminder Workflow

```
[Trigger: Schedule] → [HTTP Request to /api/n8n/reports/aged-receivables] → [Filter: Overdue Invoices] → [Loop] → [Send Email Reminder] → [HTTP Request to update invoice]
```

- Runs weekly or as configured
- Identifies overdue invoices
- Sends customized reminder emails to customers
- Updates invoice with reminder sent status

### 6.3 Monthly Reporting Workflow

```
[Trigger: Schedule] → [HTTP Request to /api/n8n/reports/pl] → [HTTP Request to /api/n8n/reports/balance-sheet] → [HTTP Request to /api/n8n/reports/cash-flow] → [Create PDF Reports] → [Send Email to Stakeholders]
```

- Runs monthly on specified date
- Generates key financial reports
- Compiles into PDF format
- Emails to specified stakeholders

### 6.4 Anomaly Alert Workflow

```
[Trigger: Webhook from anomaly.detected] → [Decision: Severity] → [Switch: Alert Channel] → [Send Alert (Email/Slack/SMS)]
```

- Triggered by anomaly detection webhook
- Routes alerts based on severity
- Sends notifications through appropriate channels

### 6.5 Cash Flow Alert Workflow

```
[Trigger: Schedule] → [HTTP Request to /api/n8n/analysis/cash-forecast] → [Filter: Cash Below Threshold] → [Send Alert] → [HTTP Request to /api/n8n/reports/aged-receivables] → [Suggest Actions]
```

- Runs weekly or as configured
- Checks cash flow forecast
- Alerts if cash projected to fall below threshold
- Suggests actions (e.g., follow up on specific receivables)

## 7. Data Format Requirements

### 7.1 Request Format

- All API requests should use JSON format
- Date formats should follow ISO 8601 standard (YYYY-MM-DD)
- Currency values should include currency code
- Arrays should be used for batch operations

### 7.2 Response Format

Standard response structure:
```json
{
  "success": true/false,
  "data": { ... },
  "error": { "code": "ERROR_CODE", "message": "Error description" },
  "meta": { "page": 1, "pageSize": 20, "total": 100 }
}
```

## 8. Error Handling Requirements

### 8.1 Error Codes

| Error Code | Description |
|------------|-------------|
| `AUTH_FAILED` | Authentication failed |
| `INVALID_PARAMS` | Invalid parameters |
| `XERO_API_ERROR` | Error from Xero API |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `INTERNAL_ERROR` | Internal server error |

### 8.2 Error Responses

- Clear error messages with actionable information
- Include original request ID for troubleshooting
- Log detailed error information server-side

## 9. Performance Requirements

- API endpoints should respond within 2 seconds for simple requests
- Batch operations should handle up to 100 items
- Webhooks should be delivered within 5 seconds of event
- Rate limiting should allow at least 100 requests per minute per API key

## 10. Documentation Requirements

### 10.1 API Documentation

- OpenAPI/Swagger specification for all endpoints
- Example requests and responses
- Authentication instructions
- Error handling guidance

### 10.2 Workflow Documentation

- Step-by-step setup instructions for each pre-built workflow
- Screenshots of n8n configuration
- Customization options
- Troubleshooting guide

## 11. Testing Requirements

- Endpoint testing tools (e.g., Postman collection)
- Webhook testing endpoint for simulating events
- Sample data for testing workflows
- Integration test environment

## 12. Implementation Considerations

### 12.1 n8n Version Compatibility

- Support for n8n version 0.125.0 and higher
- Testing with latest stable n8n release
- Documentation of any version-specific features

### 12.2 Custom n8n Nodes (Future Enhancement)

- Consider developing custom n8n nodes for Xero Agent
- Package nodes for easy installation
- Provide node documentation and examples
