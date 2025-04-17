# Xero Accounting & CFO Assistant Agent - Technical Specification

## 1. Introduction

### 1.1 Purpose
This technical specification document provides detailed requirements and implementation guidelines for the Xero Accounting & CFO Assistant Agent. It serves as a comprehensive reference for developers implementing the system.

### 1.2 Scope
This document covers the technical aspects of the Xero Agent, including system architecture, API specifications, data models, integration requirements, and implementation details.

### 1.3 Intended Audience
- Software developers implementing the system
- System architects and designers
- QA engineers testing the system
- Project managers overseeing development

### 1.4 References
- Xero API Documentation
- n8n Documentation
- Replit Deployment Guidelines
- OAuth 2.0 Specification

## 2. System Overview

### 2.1 System Description
The Xero Accounting & CFO Assistant Agent is a comprehensive wrapper around the Xero API that provides both day-to-day bookkeeping functionality and higher-level financial analysis capabilities. The system integrates with n8n for workflow automation and is deployed on Replit.

### 2.2 System Context
```
┌─────────────────────────────────────────────────────────────────┐
│                      External Environment                        │
│                                                                 │
│  ┌─────────────┐      ┌───────────────────────┐     ┌────────┐  │
│  │  End Users  │      │  Xero API             │     │  n8n   │  │
│  └─────┬───────┘      └───────────┬───────────┘     └────┬───┘  │
│        │                          │                      │      │
└────────┼──────────────────────────┼──────────────────────┼──────┘
         │                          │                      │
         ▼                          ▼                      ▼
┌────────────────────────────────────────────────────────────────┐
│                      Xero Agent System                          │
│                                                                │
│  ┌─────────────┐      ┌───────────────────────┐     ┌────────┐ │
│  │  Web UI     │      │  Backend Services     │     │ API    │ │
│  └─────────────┘      └───────────────────────┘     └────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 2.3 System Goals
- Provide a complete wrapper around the Xero API
- Automate bookkeeping tasks
- Deliver CFO-level financial analysis
- Integrate with n8n for workflow automation
- Support multi-user access with role-based permissions
- Ensure secure and reliable operation

## 3. Functional Requirements

### 3.1 Xero API Wrapper

#### 3.1.1 Contacts Management
- Create, read, update, and delete contacts
- Search and filter contacts
- Manage contact groups
- Handle contact history

#### 3.1.2 Accounts Management
- Retrieve and update chart of accounts
- Manage account codes and tax rates
- Track account balances
- Handle account history

#### 3.1.3 Invoices and Bills
- Create, approve, edit, and void sales invoices
- Create, approve, edit, and void purchase bills
- Support line items, due dates, and tax calculations
- Send invoices via email
- Attach files and PDFs to invoices
- Track invoice and bill status

#### 3.1.4 Credit Notes
- Create and apply credit notes to invoices
- Manage credit note allocations
- Track credit note history

#### 3.1.5 Payments
- Apply payments to invoices and bills
- Handle overpayments and prepayments
- Track payment history
- Reconcile payments with bank transactions

#### 3.1.6 Bank Transactions
- Create "spend money" or "receive money" transactions
- Categorize transactions
- Reconcile transactions with bank statements
- Track transaction history

#### 3.1.7 Bank Transfers
- Record transfers between bank accounts
- Track transfer history
- Reconcile transfers with bank statements

#### 3.1.8 Expense Claims
- Submit expense claims
- Attach receipt images
- Track expense claim status
- Approve or reject expense claims

#### 3.1.9 Manual Journals
- Create journal entries for adjustments
- Support multi-line journals
- Track journal history

#### 3.1.10 Reports
- Fetch financial reports (Balance Sheet, P&L, Trial Balance, etc.)
- Parse reports into usable data structures
- Generate custom reports
- Export reports in various formats

#### 3.1.11 Budgets
- Retrieve budget data
- Compare actuals vs budgets
- Track budget variances

#### 3.1.12 Users & Organization Info
- Fetch organization details
- Retrieve user list
- Manage user permissions

#### 3.1.13 Attachments
- Upload attachments for records
- Download attachments
- Manage attachment metadata

### 3.2 Bookkeeping Automation

#### 3.2.1 Bank Reconciliation Automation
- Retrieve unreconciled bank statement lines
- Match transactions with invoices and bills
- Create payment records for matches
- Flag unmatched transactions for review
- Generate reconciliation reports

#### 3.2.2 Transaction Categorization
- Apply rules for transaction categorization
- Use machine learning for category prediction
- Learn from user corrections
- Manage categorization rules
- Provide category suggestions

#### 3.2.3 Invoicing Automation
- Generate invoices based on templates
- Schedule recurring invoices
- Send invoices to customers
- Track invoice status
- Send payment reminders

#### 3.2.4 Bill Processing
- Extract data from bill images or PDFs
- Create bill records in Xero
- Schedule payments based on due dates
- Track bill status
- Manage supplier information

#### 3.2.5 Payments and Collections
- Send payment reminders for overdue invoices
- Track payment status
- Generate payment reports
- Forecast cash collections

#### 3.2.6 Period Close Assistance
- Verify all accounts are reconciled
- Check for unprocessed transactions
- Generate draft financial statements
- Provide period close checklist

### 3.3 Financial Analysis

#### 3.3.1 Financial Reporting
- Generate key financial reports
- Calculate financial metrics
- Provide period-over-period comparisons
- Visualize financial data
- Export reports in various formats

#### 3.3.2 Cash Flow Forecasting
- Project short-term cash flow based on AR/AP
- Generate long-term forecasts using historical data
- Support scenario planning
- Identify potential cash shortfalls
- Provide cash flow recommendations

#### 3.3.3 Budget Analysis
- Compare actuals to budget
- Calculate variances
- Identify trends
- Provide budget recommendations
- Generate variance reports

#### 3.3.4 KPI Dashboard
- Calculate key financial metrics
- Track metric changes over time
- Generate alerts for significant changes
- Provide customizable dashboard views
- Support drill-down for detailed analysis

#### 3.3.5 Anomaly Detection
- Analyze financial data for unusual patterns
- Identify potential errors or fraud
- Generate alerts for significant anomalies
- Provide explanations and recommendations
- Track resolution of anomalies

### 3.4 n8n Integration

#### 3.4.1 API Endpoints
- Expose endpoints for n8n to trigger actions
- Support authentication for n8n requests
- Provide comprehensive error handling
- Document API for n8n integration

#### 3.4.2 Webhooks
- Send webhooks to n8n for events
- Support webhook configuration
- Provide webhook security
- Track webhook delivery status

#### 3.4.3 Workflow Templates
- Provide pre-built workflow templates
- Support custom workflow creation
- Document workflow configuration
- Provide examples for common scenarios

### 3.5 User Management

#### 3.5.1 User Authentication
- Support email/password authentication
- Implement OAuth 2.0 for Xero
- Manage user sessions
- Handle password reset and recovery

#### 3.5.2 Role-Based Access Control
- Define user roles (Admin, Standard, Read-Only, etc.)
- Manage permissions for each role
- Control access to features and data
- Support custom role creation

#### 3.5.3 Multi-Tenant Support
- Support multiple Xero organizations
- Manage tenant connections
- Control user access to tenants
- Support tenant switching

## 4. Non-Functional Requirements

### 4.1 Performance Requirements
- API response time < 2 seconds for 95% of requests
- Support for at least 100 concurrent users
- Handle organizations with up to 10,000 transactions
- Generate reports in < 10 seconds
- Support batch operations for up to 100 items

### 4.2 Security Requirements
- Secure authentication using industry standards
- Encryption of sensitive data at rest and in transit
- Role-based access control
- Audit logging for security events
- Protection against common web vulnerabilities

### 4.3 Reliability Requirements
- System availability of 99.9% during business hours
- Graceful handling of Xero API outages
- Automatic recovery from temporary failures
- Data backup and recovery mechanisms
- Comprehensive error handling and logging

### 4.4 Scalability Requirements
- Support for growing transaction volumes
- Ability to handle increasing user load
- Efficient use of Replit resources
- Caching for frequently accessed data
- Optimized database queries

### 4.5 Usability Requirements
- Intuitive user interface
- Responsive design for mobile and desktop
- Clear error messages and notifications
- Comprehensive help documentation
- Accessibility compliance

### 4.6 Compatibility Requirements
- Support for modern web browsers
- Compatibility with Xero API versions
- Integration with n8n versions
- Support for various export formats (PDF, CSV, Excel)

## 5. System Architecture

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Xero Agent Application                      │
├─────────────┬─────────────────────────────┬─────────────────────┤
│  Frontend   │        Backend Core         │  Integration Layer   │
│  (Web UI)   │                             │                      │
├─────────────┼─────────────────────────────┼─────────────────────┤
│ - Dashboard │ - Authentication Module     │ - Xero API Wrapper   │
│ - User      │ - User Management           │ - n8n Integration    │
│   Management│ - Data Processing           │ - Webhook Handlers   │
│ - Reports   │ - Business Logic            │                      │
│ - Settings  │ - Database Access           │                      │
└─────────────┴─────────────────────────────┴─────────────────────┘
       ▲                   ▲                         ▲
       │                   │                         │
       ▼                   ▼                         ▼
┌─────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│  Database   │   │     n8n Workflows   │   │     Xero API        │
└─────────────┘   └─────────────────────┘   └─────────────────────┘
```

### 5.2 Component Architecture

#### 5.2.1 Frontend Components
- React.js components for UI
- Redux or Context API for state management
- Material-UI or Tailwind CSS for styling
- Chart.js or D3.js for data visualization
- Formik with Yup for form handling

#### 5.2.2 Backend Components
- Express.js for API endpoints
- Passport.js for authentication
- Sequelize or Prisma for database access
- Winston for logging
- Joi for validation

#### 5.2.3 Integration Components
- Xero Node.js SDK for API access
- Axios for HTTP requests
- JWT for API authentication
- Webhook handlers for events
- n8n integration modules

### 5.3 Data Flow Architecture

#### 5.3.1 Authentication Flow
```
┌──────────┐     ┌───────────────┐     ┌──────────────┐
│  User    │     │  Xero Agent   │     │  Xero API    │
└────┬─────┘     └───────┬───────┘     └──────┬───────┘
     │                   │                    │
     │    Login          │                    │
     │─────────────────>│                    │
     │                   │                    │
     │                   │  OAuth2 Request    │
     │                   │───────────────────>│
     │                   │                    │
     │ Redirect to Xero  │                    │
     │<──────────────────│                    │
     │                   │                    │
     │ Authorize App     │                    │
     │────────────────────────────────────────>
     │                   │                    │
     │ Auth Code         │                    │
     │<────────────────────────────────────────
     │                   │                    │
     │ Submit Auth Code  │                    │
     │─────────────────>│                    │
     │                   │  Exchange Code     │
     │                   │───────────────────>│
     │                   │                    │
     │                   │  Access Token      │
     │                   │<───────────────────│
     │                   │                    │
     │ Authentication    │                    │
     │ Complete          │                    │
     │<──────────────────│                    │
```

#### 5.3.2 API Request Flow
```
┌──────────┐     ┌───────────────┐     ┌──────────────┐
│  Client  │     │  Xero Agent   │     │  Xero API    │
└────┬─────┘     └───────┬───────┘     └──────┬───────┘
     │                   │                    │
     │ API Request       │                    │
     │ with JWT Token    │                    │
     │─────────────────>│                    │
     │                   │                    │
     │                   │ Validate Token     │
     │                   │─────┐              │
     │                   │<────┘              │
     │                   │                    │
     │                   │ Process Request    │
     │                   │─────┐              │
     │                   │<────┘              │
     │                   │                    │
     │                   │ Xero API Request   │
     │                   │ with Access Token  │
     │                   │───────────────────>│
     │                   │                    │
     │                   │ API Response       │
     │                   │<───────────────────│
     │                   │                    │
     │                   │ Process Response   │
     │                   │─────┐              │
     │                   │<────┘              │
     │                   │                    │
     │ API Response      │                    │
     │<──────────────────│                    │
```

#### 5.3.3 Webhook Flow
```
┌──────────┐     ┌───────────────┐     ┌──────────────┐
│  n8n     │     │  Xero Agent   │     │  Xero API    │
└────┬─────┘     └───────┬───────┘     └──────┬───────┘
     │                   │                    │
     │                   │                    │
     │                   │ Event Occurs       │
     │                   │<───────────────────│
     │                   │                    │
     │                   │ Process Event      │
     │                   │─────┐              │
     │                   │<────┘              │
     │                   │                    │
     │ Webhook Event     │                    │
     │<──────────────────│                    │
     │                   │                    │
     │ Process Webhook   │                    │
     │─────┐             │                    │
     │<────┘             │                    │
     │                   │                    │
     │ Webhook Response  │                    │
     │─────────────────>│                    │
     │                   │                    │
```

## 6. Database Design

### 6.1 Entity Relationship Diagram

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│     User      │       │  XeroTenant   │       │   XeroToken   │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ id            │       │ id            │       │ id            │
│ email         │       │ tenantId      │       │ userId        │
│ passwordHash  │       │ tenantName    │       │ tenantId      │
│ firstName     │       │ tenantType    │       │ accessToken   │
│ lastName      │       │ createdAt     │       │ refreshToken  │
│ role          │       │ updatedAt     │       │ expiresAt     │
│ createdAt     │       └───────┬───────┘       │ createdAt     │
│ updatedAt     │               │               │ updatedAt     │
└───────┬───────┘               │               └───────┬───────┘
        │                       │                       │
        │                       │                       │
        │                       │                       │
        │                       ▼                       │
        │               ┌───────────────┐               │
        └───────────────► UserTenant    ◄───────────────┘
                        ├───────────────┤
                        │ id            │
                        │ userId        │
                        │ tenantId      │
                        │ isActive      │
                        │ createdAt     │
                        │ updatedAt     │
                        └───────────────┘
                                │
                                │
                                ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ CategoryRule  │       │ Transaction   │       │ Report        │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ id            │       │ id            │       │ id            │
│ userId        │       │ tenantId      │       │ tenantId      │
│ tenantId      │       │ xeroId        │       │ userId        │
│ pattern       │       │ type          │       │ type          │
│ category      │       │ amount        │       │ name          │
│ priority      │       │ date          │       │ data          │
│ createdAt     │       │ category      │       │ createdAt     │
│ updatedAt     │       │ createdAt     │       │ updatedAt     │
└───────────────┘       └───────────────┘       └───────────────┘
```

### 6.2 Table Definitions

#### 6.2.1 User Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | User email (unique) |
| passwordHash | VARCHAR(255) | Bcrypt hashed password |
| firstName | VARCHAR(100) | User first name |
| lastName | VARCHAR(100) | User last name |
| role | VARCHAR(50) | User role (Admin, Standard, etc.) |
| createdAt | TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | Record update time |

#### 6.2.2 XeroTenant Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenantId | VARCHAR(255) | Xero tenant ID |
| tenantName | VARCHAR(255) | Xero organization name |
| tenantType | VARCHAR(50) | Tenant type (Organization, Practice, etc.) |
| createdAt | TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | Record update time |

#### 6.2.3 XeroToken Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Foreign key to User |
| tenantId | UUID | Foreign key to XeroTenant |
| accessToken | TEXT | Encrypted access token |
| refreshToken | TEXT | Encrypted refresh token |
| expiresAt | TIMESTAMP | Token expiration time |
| createdAt | TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | Record update time |

#### 6.2.4 UserTenant Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Foreign key to User |
| tenantId | UUID | Foreign key to XeroTenant |
| isActive | BOOLEAN | Whether this is the active tenant for the user |
| createdAt | TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | Record update time |

#### 6.2.5 CategoryRule Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Foreign key to User |
| tenantId | UUID | Foreign key to XeroTenant |
| pattern | VARCHAR(255) | Pattern to match for categorization |
| category | VARCHAR(100) | Category to assign |
| priority | INTEGER | Rule priority (higher takes precedence) |
| createdAt | TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | Record update time |

#### 6.2.6 Transaction Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenantId | UUID | Foreign key to XeroTenant |
| xeroId | VARCHAR(255) | Xero transaction ID |
| type | VARCHAR(50) | Transaction type |
| amount | DECIMAL(19,4) | Transaction amount |
| date | DATE | Transaction date |
| category | VARCHAR(100) | Assigned category |
| createdAt | TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | Record update time |

#### 6.2.7 Report Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenantId | UUID | Foreign key to XeroTenant |
| userId | UUID | Foreign key to User |
| type | VARCHAR(50) | Report type |
| name | VARCHAR(255) | Report name |
| data | JSON | Report data |
| createdAt | TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | Record update time |

### 6.3 Indexes and Constraints

#### 6.3.1 Primary Keys
- All tables have a UUID primary key

#### 6.3.2 Foreign Keys
- UserTenant.userId references User.id
- UserTenant.tenantId references XeroTenant.id
- XeroToken.userId references User.id
- XeroToken.tenantId references XeroTenant.id
- CategoryRule.userId references User.id
- CategoryRule.tenantId references XeroTenant.id
- Transaction.tenantId references XeroTenant.id
- Report.tenantId references XeroTenant.id
- Report.userId references User.id

#### 6.3.3 Unique Constraints
- User.email is unique
- XeroTenant.tenantId is unique
- Combination of UserTenant.userId and UserTenant.tenantId is unique
- Combination of XeroToken.userId and XeroToken.tenantId is unique

#### 6.3.4 Indexes
- Index on User.email for login lookups
- Index on XeroTenant.tenantId for Xero API operations
- Index on Transaction.xeroId for synchronization
- Index on Transaction.date for reporting
- Index on CategoryRule.pattern for rule matching

## 7. API Specification

### 7.1 Authentication API

#### 7.1.1 User Registration
- **Endpoint**: POST /api/auth/register
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Standard",
      "createdAt": "2025-04-17T12:00:00Z"
    }
  }
  ```

#### 7.1.2 User Login
- **Endpoint**: POST /api/auth/login
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "Standard"
      }
    }
  }
  ```

#### 7.1.3 Xero OAuth Authorization
- **Endpoint**: GET /api/auth/xero
- **Response**: Redirects to Xero authorization page

#### 7.1.4 Xero OAuth Callback
- **Endpoint**: GET /api/auth/xero/callback
- **Query Parameters**: code, state
- **Response**: Redirects to application with success/error

### 7.2 User Management API

#### 7.2.1 Get Current User
- **Endpoint**: GET /api/users/me
- **Headers**: Authorization: Bearer {token}
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Standard",
      "tenants": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440000",
          "tenantId": "xero-tenant-id",
          "tenantName": "Example Organization",
          "isActive": true
        }
      ]
    }
  }
  ```

#### 7.2.2 List Users (Admin only)
- **Endpoint**: GET /api/users
- **Headers**: Authorization: Bearer {token}
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "Standard",
        "createdAt": "2025-04-17T12:00:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 20,
      "total": 1
    }
  }
  ```

### 7.3 Xero Integration API

#### 7.3.1 List Connected Tenants
- **Endpoint**: GET /api/xero/tenants
- **Headers**: Authorization: Bearer {token}
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "tenantId": "xero-tenant-id",
        "tenantName": "Example Organization",
        "tenantType": "Organization",
        "isActive": true,
        "createdAt": "2025-04-17T12:00:00Z"
      }
    ]
  }
  ```

#### 7.3.2 Set Active Tenant
- **Endpoint**: PUT /api/xero/tenants/active
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
  ```json
  {
    "tenantId": "660e8400-e29b-41d4-a716-446655440000"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "tenantId": "xero-tenant-id",
      "tenantName": "Example Organization",
      "tenantType": "Organization",
      "isActive": true
    }
  }
  ```

### 7.4 Bookkeeping API

#### 7.4.1 List Invoices
- **Endpoint**: GET /api/bookkeeping/invoices
- **Headers**: Authorization: Bearer {token}
- **Query Parameters**: page, pageSize, status, dateFrom, dateTo
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "invoiceNumber": "INV-0001",
        "contact": {
          "id": "880e8400-e29b-41d4-a716-446655440000",
          "name": "Example Customer"
        },
        "date": "2025-04-17",
        "dueDate": "2025-05-17",
        "status": "AUTHORISED",
        "total": 1000.00,
        "amountDue": 1000.00,
        "currency": "USD"
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 20,
      "total": 1
    }
  }
  ```

#### 7.4.2 Create Invoice
- **Endpoint**: POST /api/bookkeeping/invoices
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
  ```json
  {
    "contact": {
      "id": "880e8400-e29b-41d4-a716-446655440000"
    },
    "date": "2025-04-17",
    "dueDate": "2025-05-17",
    "lineItems": [
      {
        "description": "Consulting Services",
        "quantity": 10,
        "unitAmount": 100.00,
        "accountCode": "200",
        "taxType": "OUTPUT"
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "invoiceNumber": "INV-0001",
      "contact": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "name": "Example Customer"
      },
      "date": "2025-04-17",
      "dueDate": "2025-05-17",
      "status": "DRAFT",
      "total": 1000.00,
      "amountDue": 1000.00,
      "currency": "USD",
      "lineItems": [
        {
          "description": "Consulting Services",
          "quantity": 10,
          "unitAmount": 100.00,
          "accountCode": "200",
          "taxType": "OUTPUT",
          "lineAmount": 1000.00
        }
      ]
    }
  }
  ```

### 7.5 Financial Analysis API

#### 7.5.1 Get Cash Flow Forecast
- **Endpoint**: GET /api/analysis/cash-flow-forecast
- **Headers**: Authorization: Bearer {token}
- **Query Parameters**: weeks, scenario
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "currentBalance": 50000.00,
      "currency": "USD",
      "forecast": [
        {
          "week": "2025-04-21",
          "inflows": 10000.00,
          "outflows": 8000.00,
          "netFlow": 2000.00,
          "endingBalance": 52000.00
        },
        {
          "week": "2025-04-28",
          "inflows": 12000.00,
          "outflows": 9000.00,
          "netFlow": 3000.00,
          "endingBalance": 55000.00
        }
      ],
      "summary": {
        "totalInflows": 22000.00,
        "totalOutflows": 17000.00,
        "netFlow": 5000.00
      }
    }
  }
  ```

#### 7.5.2 Get KPI Dashboard
- **Endpoint**: GET /api/analysis/kpi-dashboard
- **Headers**: Authorization: Bearer {token}
- **Query Parameters**: period
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "period": "2025-04",
      "kpis": {
        "revenue": {
          "value": 50000.00,
          "change": 5.2,
          "trend": "up"
        },
        "expenses": {
          "value": 40000.00,
          "change": -2.1,
          "trend": "down"
        },
        "profit": {
          "value": 10000.00,
          "change": 12.5,
          "trend": "up"
        },
        "cashBalance": {
          "value": 55000.00,
          "change": 10.0,
          "trend": "up"
        },
        "accountsReceivable": {
          "value": 25000.00,
          "change": -5.0,
          "trend": "down"
        },
        "accountsPayable": {
          "value": 15000.00,
          "change": 3.0,
          "trend": "up"
        }
      }
    }
  }
  ```

### 7.6 n8n Integration API

#### 7.6.1 Trigger Bank Reconciliation
- **Endpoint**: POST /api/n8n/reconcile
- **Headers**: Authorization: Bearer {token}, X-API-Key: {apiKey}
- **Request Body**:
  ```json
  {
    "accountId": "990e8400-e29b-41d4-a716-446655440000",
    "dateFrom": "2025-04-01",
    "dateTo": "2025-04-17"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "jobId": "job-123456",
      "status": "processing",
      "message": "Bank reconciliation started"
    }
  }
  ```

#### 7.6.2 Get Reconciliation Status
- **Endpoint**: GET /api/n8n/reconcile/{jobId}
- **Headers**: Authorization: Bearer {token}, X-API-Key: {apiKey}
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "jobId": "job-123456",
      "status": "completed",
      "results": {
        "totalTransactions": 50,
        "matchedTransactions": 45,
        "unmatchedTransactions": 5
      }
    }
  }
  ```

## 8. Implementation Guidelines

### 8.1 Technology Stack

#### 8.1.1 Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: SQLite (dev), PostgreSQL (prod option)
- **ORM**: Sequelize
- **Authentication**: Passport.js, JWT
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest

#### 8.1.2 Frontend
- **Framework**: React.js
- **State Management**: Redux or Context API
- **UI Library**: Material-UI or Tailwind CSS
- **Form Handling**: Formik with Yup
- **HTTP Client**: Axios
- **Testing**: Jest, React Testing Library

### 8.2 Coding Standards

#### 8.2.1 JavaScript/TypeScript
- Follow Airbnb JavaScript Style Guide
- Use ES6+ features
- Use async/await for asynchronous code
- Use proper error handling with try/catch
- Document code with JSDoc comments

#### 8.2.2 API Design
- Follow RESTful API design principles
- Use consistent naming conventions
- Implement proper error handling
- Include pagination for list endpoints
- Document API with OpenAPI/Swagger

#### 8.2.3 Database
- Use migrations for schema changes
- Follow naming conventions for tables and columns
- Implement proper indexing
- Use transactions for data integrity
- Implement soft deletes where appropriate

### 8.3 Security Guidelines

#### 8.3.1 Authentication
- Use bcrypt for password hashing
- Implement proper token validation
- Use HTTPS for all communications
- Implement CSRF protection
- Use secure cookies with HttpOnly and Secure flags

#### 8.3.2 Authorization
- Implement role-based access control
- Validate permissions for all operations
- Implement proper tenant isolation
- Log security events
- Implement rate limiting

#### 8.3.3 Data Protection
- Encrypt sensitive data at rest
- Use parameterized queries
- Validate and sanitize all inputs
- Implement proper error handling
- Follow principle of least privilege

### 8.4 Testing Guidelines

#### 8.4.1 Unit Testing
- Test individual components and functions
- Use mocks for external dependencies
- Achieve high code coverage
- Test edge cases and error conditions
- Use test-driven development where appropriate

#### 8.4.2 Integration Testing
- Test API endpoints
- Test database operations
- Test authentication and authorization
- Test error handling
- Test performance under load

#### 8.4.3 End-to-End Testing
- Test complete user flows
- Test UI interactions
- Test integration with external services
- Test deployment configuration
- Test backup and recovery

## 9. Deployment Guidelines

### 9.1 Replit Deployment

#### 9.1.1 Environment Setup
- Configure Node.js environment
- Set up environment variables
- Configure database connection
- Set up file storage
- Configure logging

#### 9.1.2 Deployment Process
- Push code to Replit
- Install dependencies
- Run database migrations
- Start application
- Verify deployment

### 9.2 Monitoring and Maintenance

#### 9.2.1 Logging
- Implement comprehensive logging
- Log application events
- Log security events
- Log performance metrics
- Implement log rotation

#### 9.2.2 Monitoring
- Monitor application health
- Monitor performance metrics
- Monitor error rates
- Set up alerts for critical issues
- Implement uptime monitoring

#### 9.2.3 Backup and Recovery
- Implement database backups
- Implement file backups
- Test recovery procedures
- Document backup and recovery processes
- Implement disaster recovery plan

## 10. Integration Guidelines

### 10.1 Xero API Integration

#### 10.1.1 Authentication
- Implement OAuth 2.0 flow
- Securely store tokens
- Implement token refresh
- Handle authentication errors
- Monitor token usage

#### 10.1.2 API Usage
- Follow Xero API best practices
- Implement proper error handling
- Respect API rate limits
- Implement caching where appropriate
- Monitor API usage

### 10.2 n8n Integration

#### 10.2.1 API Endpoints
- Implement secure API endpoints
- Document API for n8n integration
- Implement proper error handling
- Support webhook callbacks
- Provide example workflows

#### 10.2.2 Webhooks
- Implement webhook handlers
- Secure webhook endpoints
- Implement retry logic
- Log webhook events
- Monitor webhook delivery

## 11. Documentation Requirements

### 11.1 User Documentation
- Installation and setup guide
- User manual
- Feature documentation
- Troubleshooting guide
- FAQ

### 11.2 Developer Documentation
- API documentation
- Code documentation
- Architecture documentation
- Integration documentation
- Deployment documentation

### 11.3 Maintenance Documentation
- Backup and recovery procedures
- Monitoring procedures
- Troubleshooting procedures
- Security procedures
- Upgrade procedures
