# API Documentation

This document provides detailed information about the Xero CFO Assistant Agent API endpoints, request/response formats, and authentication requirements.

## Authentication

All API endpoints (except authentication endpoints) require authentication using JWT tokens.

### JWT Authentication

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### API Keys

For n8n integration endpoints, you can also use API key authentication:

```
X-API-Key: <your_api_key>
```

## Response Format

All API responses follow a standard format:

```json
{
  "success": true|false,
  "data": {}, // Response data (when success is true)
  "message": "", // Success or error message
  "errors": [] // Validation errors (when applicable)
}
```

## Endpoints

### Authentication

#### Register User

```
POST /api/auth/register
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "User registered successfully"
}
```

#### Login

```
POST /api/auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "userId": "user123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "message": "Login successful"
}
```

#### Initiate Xero OAuth

```
GET /api/auth/xero
```

This endpoint redirects the user to the Xero authorization page.

#### Xero OAuth Callback

```
GET /api/auth/xero/callback
```

This endpoint handles the callback from Xero after authorization.

#### Get User Profile

```
GET /api/auth/profile
```

Response:
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### Update User Profile

```
PUT /api/auth/profile
```

Request body:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "currentPassword": "currentpassword",
  "newPassword": "newpassword"
}
```

Response:
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

### Xero Integration

#### List Xero Tenants

```
GET /api/xero/tenants
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "tenant123",
      "name": "My Company",
      "isActive": true
    },
    {
      "id": "tenant456",
      "name": "Another Company",
      "isActive": false
    }
  ]
}
```

#### Set Active Tenant

```
PUT /api/xero/tenants/:tenantId/active
```

Response:
```json
{
  "success": true,
  "message": "Active tenant updated successfully"
}
```

#### List Xero Contacts

```
GET /api/xero/contacts
```

Query parameters:
- `page` (optional): Page number
- `pageSize` (optional): Page size
- `where` (optional): Filter criteria
- `order` (optional): Sort order

Response:
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "contactID": "contact123",
        "name": "ABC Ltd",
        "emailAddress": "info@abcltd.com",
        "phones": [...],
        "addresses": [...]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalItems": 45
    }
  }
}
```

#### List Xero Accounts

```
GET /api/xero/accounts
```

Query parameters:
- `page` (optional): Page number
- `pageSize` (optional): Page size
- `where` (optional): Filter criteria
- `order` (optional): Sort order

Response:
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "accountID": "account123",
        "code": "1000",
        "name": "Sales",
        "type": "REVENUE",
        "status": "ACTIVE"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 3,
      "totalItems": 25
    }
  }
}
```

#### List Xero Invoices

```
GET /api/xero/invoices
```

Query parameters:
- `page` (optional): Page number
- `pageSize` (optional): Page size
- `where` (optional): Filter criteria
- `order` (optional): Sort order
- `status` (optional): Invoice status

Response:
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "invoiceID": "invoice123",
        "type": "ACCREC",
        "contact": {
          "contactID": "contact123",
          "name": "ABC Ltd"
        },
        "date": "2023-01-01",
        "dueDate": "2023-01-15",
        "status": "AUTHORISED",
        "lineItems": [...],
        "total": 100.00,
        "amountDue": 100.00,
        "amountPaid": 0.00
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalItems": 45
    }
  }
}
```

#### List Xero Bills

```
GET /api/xero/bills
```

Query parameters:
- `page` (optional): Page number
- `pageSize` (optional): Page size
- `where` (optional): Filter criteria
- `order` (optional): Sort order
- `status` (optional): Bill status

Response:
```json
{
  "success": true,
  "data": {
    "bills": [
      {
        "invoiceID": "bill123",
        "type": "ACCPAY",
        "contact": {
          "contactID": "contact123",
          "name": "Supplier Ltd"
        },
        "date": "2023-01-01",
        "dueDate": "2023-01-15",
        "status": "AUTHORISED",
        "lineItems": [...],
        "total": 100.00,
        "amountDue": 100.00,
        "amountPaid": 0.00
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalItems": 45
    }
  }
}
```

#### List Xero Bank Transactions

```
GET /api/xero/bank-transactions
```

Query parameters:
- `page` (optional): Page number
- `pageSize` (optional): Page size
- `where` (optional): Filter criteria
- `order` (optional): Sort order
- `bankAccountId` (optional): Bank account ID
- `from` (optional): Start date
- `to` (optional): End date

Response:
```json
{
  "success": true,
  "data": {
    "bankTransactions": [
      {
        "bankTransactionID": "transaction123",
        "type": "RECEIVE",
        "date": "2023-01-01",
        "status": "AUTHORISED",
        "bankAccount": {
          "accountID": "account123",
          "code": "1000",
          "name": "Main Account"
        },
        "amount": 100.00,
        "reference": "Payment for invoice #123",
        "isReconciled": false
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalItems": 45
    }
  }
}
```

### Bookkeeping

#### Reconcile Bank Transactions

```
POST /api/bookkeeping/reconcile
```

Request body:
```json
{
  "bankTransactionId": "transaction123",
  "invoiceId": "invoice123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "reconciled": true,
    "bankTransaction": {
      "bankTransactionID": "transaction123",
      "isReconciled": true
    },
    "invoice": {
      "invoiceID": "invoice123",
      "status": "PAID",
      "amountDue": 0.00,
      "amountPaid": 100.00
    }
  },
  "message": "Transaction reconciled successfully"
}
```

#### Categorize Transactions

```
POST /api/bookkeeping/categorize
```

Request body:
```json
{
  "bankTransactionId": "transaction123",
  "categoryId": "category123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "transaction": {
      "transactionId": "transaction123",
      "categoryId": "category123",
      "categoryName": "Office Supplies"
    }
  },
  "message": "Transaction categorized successfully"
}
```

#### List Transaction Categories

```
GET /api/bookkeeping/categories
```

Response:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "category123",
        "name": "Office Supplies",
        "description": "Office supplies and equipment"
      },
      {
        "id": "category456",
        "name": "Rent",
        "description": "Rent and lease payments"
      }
    ]
  }
}
```

#### Create Transaction Category

```
POST /api/bookkeeping/categories
```

Request body:
```json
{
  "name": "Marketing",
  "description": "Marketing and advertising expenses"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "category": {
      "id": "category789",
      "name": "Marketing",
      "description": "Marketing and advertising expenses"
    }
  },
  "message": "Category created successfully"
}
```

#### List Categorization Rules

```
GET /api/bookkeeping/rules
```

Response:
```json
{
  "success": true,
  "data": {
    "rules": [
      {
        "id": "rule123",
        "name": "Office Supplies Rule",
        "pattern": "Staples|Office Depot",
        "categoryId": "category123",
        "isActive": true
      }
    ]
  }
}
```

#### Create Categorization Rule

```
POST /api/bookkeeping/rules
```

Request body:
```json
{
  "name": "Marketing Rule",
  "pattern": "Facebook|Google Ads|Twitter",
  "categoryId": "category789",
  "isActive": true
}
```

Response:
```json
{
  "success": true,
  "data": {
    "rule": {
      "id": "rule456",
      "name": "Marketing Rule",
      "pattern": "Facebook|Google Ads|Twitter",
      "categoryId": "category789",
      "isActive": true
    }
  },
  "message": "Rule created successfully"
}
```

### Financial Analysis

#### Get Financial KPIs

```
GET /api/analysis/kpis
```

Query parameters:
- `months` (optional): Number of months to analyze (default: 3)
- `compareWithPrevious` (optional): Whether to compare with previous period (default: true)

Response:
```json
{
  "success": true,
  "data": {
    "healthScore": 85,
    "profitability": {
      "grossProfitMargin": {
        "current": 0.45,
        "previous": 0.42,
        "change": 0.03
      },
      "netProfitMargin": {
        "current": 0.15,
        "previous": 0.12,
        "change": 0.03
      }
    },
    "liquidity": {
      "currentRatio": {
        "current": 2.5,
        "previous": 2.2,
        "change": 0.3
      },
      "quickRatio": {
        "current": 1.8,
        "previous": 1.5,
        "change": 0.3
      }
    },
    "efficiency": {
      "daysReceivablesOutstanding": {
        "current": 35,
        "previous": 40,
        "change": -5
      },
      "daysPayablesOutstanding": {
        "current": 30,
        "previous": 28,
        "change": 2
      }
    }
  }
}
```

#### Get Cash Flow Forecast

```
GET /api/analysis/cash-flow/forecast
```

Query parameters:
- `days` (optional): Number of days to forecast (default: 90)

Response:
```json
{
  "success": true,
  "data": {
    "startingBalance": 10000.00,
    "netCashFlow": 5000.00,
    "lowestBalance": 8000.00,
    "lowestBalanceDate": "2023-02-15",
    "monthlyForecasts": [
      {
        "month": 1,
        "year": 2023,
        "totalInflow": 20000.00,
        "totalOutflow": 15000.00,
        "netCashFlow": 5000.00,
        "endingBalance": 15000.00
      },
      {
        "month": 2,
        "year": 2023,
        "totalInflow": 18000.00,
        "totalOutflow": 16000.00,
        "netCashFlow": 2000.00,
        "endingBalance": 17000.00
      },
      {
        "month": 3,
        "year": 2023,
        "totalInflow": 22000.00,
        "totalOutflow": 17000.00,
        "netCashFlow": 5000.00,
        "endingBalance": 22000.00
      }
    ],
    "inflows": [...],
    "outflows": [...]
  }
}
```

#### Get Financial Anomalies

```
GET /api/analysis/anomalies
```

Query parameters:
- `months` (optional): Number of months to analyze (default: 1)
- `threshold` (optional): Anomaly detection threshold (default: 0.2)

Response:
```json
{
  "success": true,
  "data": {
    "anomalies": [
      {
        "id": "anomaly123",
        "type": "UNUSUAL_EXPENSE",
        "description": "Unusually high expense in Office Supplies category",
        "severity": "MEDIUM",
        "date": "2023-01-15",
        "amount": 5000.00,
        "expectedAmount": 1000.00,
        "category": "Office Supplies"
      },
      {
        "id": "anomaly456",
        "type": "LATE_PAYMENT",
        "description": "Customer ABC Ltd has paid 30 days late",
        "severity": "HIGH",
        "date": "2023-01-20",
        "amount": 10000.00,
        "contactId": "contact123",
        "contactName": "ABC Ltd"
      }
    ]
  }
}
```

#### List Financial Reports

```
GET /api/analysis/reports
```

Query parameters:
- `page` (optional): Page number
- `pageSize` (optional): Page size
- `type` (optional): Report type

Response:
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report123",
        "type": "MONTHLY",
        "title": "Monthly Financial Report - January 2023",
        "createdAt": "2023-02-01T00:00:00.000Z",
        "period": {
          "fromDate": "2023-01-01",
          "toDate": "2023-01-31"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalItems": 45
    }
  }
}
```

#### Get Specific Financial Report

```
GET /api/analysis/reports/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "report": {
      "id": "report123",
      "type": "MONTHLY",
      "title": "Monthly Financial Report - January 2023",
      "createdAt": "2023-02-01T00:00:00.000Z",
      "period": {
        "fromDate": "2023-01-01",
        "toDate": "2023-01-31"
      },
      "content": "# Monthly Financial Report: January 2023\n\n## Executive Summary\n\nFinancial Health Score: 85/100 (Good)\n\nGross Profit Margin: 45.0%\n\nCurrent Ratio: 2.5\n\nProjected Cash Position (90 days): $22,000.00\n\n...",
      "kpis": {...},
      "cashFlow": {...},
      "anomalies": [...]
    }
  }
}
```

### n8n Integration

#### Get Financial KPIs for n8n

```
GET /api/n8n/kpis
```

Query parameters:
- `months` (optional): Number of months to analyze (default: 3)
- `compareWithPrevious` (optional): Whether to compare with previous period (default: true)

Authentication:
- JWT token or API key

Response: Same as `/api/analysis/kpis`

#### Get Cash Flow Forecast for n8n

```
GET /api/n8n/cash-flow/forecast
```

Query parameters:
- `days` (optional): Number of days to forecast (default: 90)

Authentication:
- JWT token or API key

Response: Same as `/api/analysis/cash-flow/forecast`

#### Get Cash Flow Issues for n8n

```
GET /api/n8n/cash-flow/issues
```

Query parameters:
- `days` (optional): Number of days to check (default: 90)
- `threshold` (optional): Minimum severity level (default: "MEDIUM")

Authentication:
- JWT token or API key

Response:
```json
{
  "success": true,
  "data": {
    "issues": [
      {
        "id": "issue123",
        "type": "NEGATIVE_BALANCE",
        "description": "Projected negative balance on 2023-02-15",
        "severity": "HIGH",
        "date": "2023-02-15",
        "amount": -2000.00
      },
      {
        "id": "issue456",
        "type": "LOW_BALANCE",
        "description": "Projected low balance (below 5000) on 2023-03-01",
        "severity": "MEDIUM",
        "date": "2023-03-01",
        "amount": 3000.00
      }
    ]
  }
}
```

#### Get Financial Anomalies for n8n

```
GET /api/n8n/anomalies
```

Query parameters:
- `months` (optional): Number of months to analyze (default: 1)
- `threshold` (optional): Anomaly detection threshold (default: 0.2)

Authentication:
- JWT token or API key

Response: Same as `/api/analysis/anomalies`

#### Sync Bank Transactions for n8n

```
POST /api/n8n/transactions/sync
```

Request body:
```json
{
  "fromDate": "2023-01-01",
  "toDate": "2023-01-31"
}
```

Authentication:
- JWT token or API key

Response:
```json
{
  "success": true,
  "data": {
    "syncedTransactions": 45,
    "newTransactions": 10,
    "updatedTransactions": 5,
    "categorizedTransactions": 8
  },
  "message": "Transactions synced successfully"
}
```

#### Get Transaction Matches for n8n

```
GET /api/n8n/transactions/:transactionId/matches
```

Authentication:
- JWT token or API key

Response:
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "transaction123",
      "date": "2023-01-15",
      "amount": 100.00,
      "description": "Payment from ABC Ltd"
    },
    "matches": [
      {
        "id": "invoice123",
        "type": "INVOICE",
        "date": "2023-01-01",
        "dueDate": "2023-01-15",
        "amount": 100.00,
        "reference": "INV-001",
        "contact": {
          "id": "contact123",
          "name": "ABC Ltd"
        },
        "matchScore": 0.95
      }
    ]
  }
}
```

#### Categorize Transactions for n8n

```
POST /api/n8n/transactions/categorize
```

Request body:
```json
{
  "transactions": [
    {
      "transactionId": "transaction123",
      "categoryId": "category123"
    },
    {
      "transactionId": "transaction456",
      "categoryId": "category456"
    }
  ]
}
```

Authentication:
- JWT token or API key

Response:
```json
{
  "success": true,
  "data": {
    "categorizedTransactions": 2,
    "transactions": [
      {
        "transactionId": "transaction123",
        "categoryId": "category123",
        "categoryName": "Office Supplies"
      },
      {
        "transactionId": "transaction456",
        "categoryId": "category456",
        "categoryName": "Rent"
      }
    ]
  },
  "message": "Transactions categorized successfully"
}
```

#### Get Overdue Invoices for n8n

```
GET /api/n8n/invoices/overdue
```

Query parameters:
- `daysOverdue` (optional): Minimum days overdue (default: 1)
- `maxResults` (optional): Maximum number of results (default: 100)

Authentication:
- JWT token or API key

Response:
```json
{
  "success": true,
  "data": {
    "overdueInvoices": [
      {
        "invoiceId": "invoice123",
        "contactId": "contact123",
        "contactName": "ABC Ltd",
        "contactEmail": "info@abcltd.com",
        "amount": 100.00,
        "dueDate": "2023-01-15",
        "daysOverdue": 10,
        "reference": "INV-001"
      }
    ]
  }
}
```

#### Generate Payment Reminder for n8n

```
GET /api/n8n/contacts/:contactId/payment-reminder
```

Query parameters:
- `template` (optional): Reminder template (default: "standard")

Authentication:
- JWT token or API key

Response:
```json
{
  "success": true,
  "data": {
    "contact": {
      "id": "contact123",
      "name": "ABC Ltd",
      "email": "info@abcltd.com"
    },
    "overdueInvoices": [...],
    "totalAmount": 500.00,
    "reminderSubject": "Payment Reminder - ABC Ltd",
    "reminderBody": "Dear ABC Ltd,\n\nThis is a friendly reminder that you have 5 overdue invoices totaling $500.00. Please arrange payment at your earliest convenience.\n\n..."
  }
}
```

#### Send Payment Reminder for n8n

```
POST /api/n8n/contacts/:contactId/payment-reminder
```

Request body:
```json
{
  "template": "standard",
  "subject": "Payment Reminder - ABC Ltd",
  "body": "Dear ABC Ltd,\n\nThis is a friendly reminder that you have 5 overdue invoices totaling $500.00. Please arrange payment at your earliest convenience.\n\n...",
  "sendEmail": true
}
```

Authentication:
- JWT token or API key

Response:
```json
{
  "success": true,
  "data": {
    "contact": {
      "id": "contact123",
      "name": "ABC Ltd",
      "email": "info@abcltd.com"
    },
    "reminderSent": true,
    "sentAt": "2023-01-25T12:00:00.000Z"
  },
  "message": "Payment reminder sent successfully"
}
```

#### Get Upcoming Bill Payments for n8n

```
GET /api/n8n/bills/upcoming
```

Query parameters:
- `days` (optional): Number of days to look ahead (default: 30)
- `maxResults` (optional): Maximum number of results (default: 100)

Authentication:
- JWT token or API key

Response:
```json
{
  "success": true,
  "data": {
    "upcomingBills": [
      {
        "billId": "bill123",
        "contactId": "contact456",
        "contactName": "Supplier Ltd",
        "amount": 200.00,
        "dueDate": "2023-02-15",
        "daysUntilDue": 20,
        "reference": "BILL-001"
      }
    ],
    "totalAmount": 200.00
  }
}
```

#### Generate Payment Schedule for n8n

```
GET /api/n8n/bills/payment-schedule
```

Query parameters:
- `days` (optional): Number of days to look ahead (default: 90)

Authentication:
- JWT token or API key

Response:
```json
{
  "success": true,
  "data": {
    "schedule": [
      {
        "date": "2023-02-15",
        "bills": [
          {
            "billId": "bill123",
            "contactName": "Supplier Ltd",
            "amount": 200.00,
            "reference": "BILL-001"
          }
        ],
        "totalAmount": 200.00
      },
      {
        "date": "2023-03-01",
        "bills": [
          {
            "billId": "bill456",
            "contactName": "Another Supplier",
            "amount": 300.00,
            "reference": "BILL-002"
          }
        ],
        "totalAmount": 300.00
      }
    ],
    "totalAmount": 500.00
  }
}
```

### Webhook Endpoints

#### Handle Xero Webhook Events

```
POST /api/webhooks/xero
```

This endpoint is called by Xero when events occur in the connected Xero account.

#### Register a New Webhook

```
POST /api/webhooks/register
```

Request body:
```json
{
  "name": "Invoice Paid Webhook",
  "url": "https://example.com/webhook",
  "events": ["invoice.paid", "invoice.updated"],
  "isActive": true
}
```

Response:
```json
{
  "success": true,
  "data": {
    "webhook": {
      "id": "webhook123",
      "name": "Invoice Paid Webhook",
      "url": "https://example.com/webhook",
      "events": ["invoice.paid", "invoice.updated"],
      "isActive": true,
      "secret": "webhook_secret_here"
    }
  },
  "message": "Webhook registered successfully"
}
```

#### List Registered Webhooks

```
GET /api/webhooks/list
```

Response:
```json
{
  "success": true,
  "data": {
    "webhooks": [
      {
        "id": "webhook123",
        "name": "Invoice Paid Webhook",
        "url": "https://example.com/webhook",
        "events": ["invoice.paid", "invoice.updated"],
        "isActive": true
      }
    ]
  }
}
```

#### Update Webhook

```
PUT /api/webhooks/:webhookId
```

Request body:
```json
{
  "name": "Updated Webhook Name",
  "url": "https://example.com/new-webhook",
  "events": ["invoice.paid"],
  "isActive": true
}
```

Response:
```json
{
  "success": true,
  "data": {
    "webhook": {
      "id": "webhook123",
      "name": "Updated Webhook Name",
      "url": "https://example.com/new-webhook",
      "events": ["invoice.paid"],
      "isActive": true
    }
  },
  "message": "Webhook updated successfully"
}
```

#### Delete Webhook

```
DELETE /api/webhooks/:webhookId
```

Response:
```json
{
  "success": true,
  "message": "Webhook deleted successfully"
}
```

#### Regenerate Webhook Secret

```
POST /api/webhooks/:webhookId/regenerate-secret
```

Response:
```json
{
  "success": true,
  "data": {
    "webhook": {
      "id": "webhook123",
      "secret": "new_webhook_secret_here"
    }
  },
  "message": "Webhook secret regenerated successfully"
}
```

#### Test Webhook

```
POST /api/webhooks/:webhookId/test
```

Response:
```json
{
  "success": true,
  "data": {
    "testResult": {
      "success": true,
      "statusCode": 200,
      "response": "Webhook received"
    }
  },
  "message": "Webhook test completed successfully"
}
```

## Error Codes

The API uses standard HTTP status codes to indicate the success or failure of a request:

- `200 OK`: The request was successful
- `201 Created`: The resource was successfully created
- `400 Bad Request`: The request was invalid or cannot be served
- `401 Unauthorized`: Authentication is required or failed
- `403 Forbidden`: The authenticated user does not have permission
- `404 Not Found`: The requested resource does not exist
- `422 Unprocessable Entity`: The request was well-formed but contains semantic errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: An error occurred on the server

## Rate Limiting

The API implements rate limiting to prevent abuse:

- Standard endpoints: 100 requests per 15 minutes
- Authentication endpoints: 10 requests per hour
- n8n integration endpoints: 60 requests per minute

When a rate limit is exceeded, the API returns a `429 Too Many Requests` response with a `Retry-After` header indicating when the client can retry the request.

## Pagination

Endpoints that return lists of resources support pagination using the following query parameters:

- `page`: Page number (1-based)
- `pageSize`: Number of items per page

The response includes pagination information:

```json
{
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalPages": 5,
    "totalItems": 45
  }
}
```

## Filtering and Sorting

Many endpoints support filtering and sorting using the following query parameters:

- `where`: Filter criteria (e.g., `Status=="DRAFT"`)
- `order`: Sort order (e.g., `DueDate ASC`)

## Versioning

The API version is included in the URL path:

```
/api/v1/...
```

The current version is v1.

## Support

For API support, contact support@xero-cfo-assistant.com or open an issue on GitHub.
