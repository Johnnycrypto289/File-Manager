# Testing Instructions

This document provides instructions for testing the Xero CFO Assistant Agent to ensure all components are functioning correctly.

## Prerequisites

Before running tests, ensure you have:

1. Node.js (v16 or higher) installed
2. npm (v7 or higher) installed
3. A test Xero account with API credentials
4. The application installed and configured according to the README.md

## Environment Setup

1. Create a `.env.test` file based on the provided `.env.example`:
   ```
   cp .env.example .env.test
   ```

2. Update the `.env.test` file with your test Xero API credentials and other configuration options.

3. Install development dependencies:
   ```
   npm install --include=dev
   ```

## Running Automated Tests

The application includes a comprehensive test suite using Jest. To run all tests:

```
npm test
```

To run specific test categories:

```
npm test -- --testPathPattern=auth     # Run authentication tests
npm test -- --testPathPattern=xero     # Run Xero API integration tests
npm test -- --testPathPattern=bookkeeping  # Run bookkeeping tests
npm test -- --testPathPattern=analysis     # Run financial analysis tests
npm test -- --testPathPattern=n8n      # Run n8n integration tests
```

To run tests with coverage report:

```
npm test -- --coverage
```

## Manual Testing Checklist

### Authentication

- [ ] **User Registration**
  - Create a new user account
  - Verify email validation
  - Test password strength requirements
  - Verify successful registration

- [ ] **User Login**
  - Login with valid credentials
  - Test invalid credentials handling
  - Verify JWT token generation
  - Test token expiration

- [ ] **Xero OAuth**
  - Initiate Xero OAuth flow
  - Authorize application in Xero
  - Verify callback handling
  - Check token storage
  - Test tenant selection

### Xero API Integration

- [ ] **Tenant Management**
  - List connected Xero tenants
  - Set active tenant
  - Switch between tenants

- [ ] **Contacts**
  - List Xero contacts
  - Test pagination
  - Test filtering

- [ ] **Accounts**
  - List Xero accounts
  - Verify account types
  - Test filtering

- [ ] **Invoices**
  - List Xero invoices
  - Test status filtering
  - Verify invoice details

- [ ] **Bills**
  - List Xero bills
  - Test status filtering
  - Verify bill details

- [ ] **Bank Transactions**
  - List Xero bank transactions
  - Test date range filtering
  - Verify transaction details

### Bookkeeping

- [ ] **Bank Reconciliation**
  - Reconcile bank transaction with invoice
  - Verify reconciliation status
  - Test multiple reconciliations

- [ ] **Transaction Categorization**
  - Categorize transactions manually
  - Test automatic categorization with rules
  - Verify category assignment

- [ ] **Category Management**
  - List transaction categories
  - Create new category
  - Update existing category
  - Delete category

- [ ] **Rule Management**
  - List categorization rules
  - Create new rule
  - Test rule pattern matching
  - Update existing rule
  - Delete rule

### Financial Analysis

- [ ] **KPI Calculation**
  - Get financial KPIs
  - Verify profitability metrics
  - Verify liquidity metrics
  - Verify efficiency metrics
  - Test comparison with previous period

- [ ] **Cash Flow Forecasting**
  - Get cash flow forecast
  - Verify forecast accuracy
  - Test different forecast periods
  - Check lowest balance detection

- [ ] **Anomaly Detection**
  - Get financial anomalies
  - Test different anomaly types
  - Verify anomaly severity
  - Test threshold adjustment

- [ ] **Report Generation**
  - List financial reports
  - Get specific report
  - Verify report content
  - Test different report types

### n8n Integration

- [ ] **API Endpoints**
  - Test all n8n API endpoints
  - Verify API key authentication
  - Test rate limiting

- [ ] **Workflow Templates**
  - Import daily reconciliation workflow
  - Import invoice reminder workflow
  - Import monthly report workflow
  - Test workflow execution

- [ ] **Webhook System**
  - Register new webhook
  - List registered webhooks
  - Update webhook
  - Test webhook
  - Delete webhook

### Security

- [ ] **Input Validation**
  - Test valid inputs
  - Test invalid inputs
  - Verify validation error messages

- [ ] **CSRF Protection**
  - Verify CSRF token generation
  - Test CSRF token validation
  - Test CSRF protection bypass attempts

- [ ] **Rate Limiting**
  - Test standard rate limits
  - Test authentication rate limits
  - Test API rate limits
  - Verify rate limit headers

- [ ] **Audit Logging**
  - Verify audit log entries for sensitive operations
  - Check log redaction of sensitive data
  - Test log retrieval

- [ ] **Data Encryption**
  - Verify token encryption
  - Test encrypted data retrieval
  - Verify encryption key handling

- [ ] **Secure Headers**
  - Check Content-Security-Policy
  - Verify X-XSS-Protection
  - Check Strict-Transport-Security
  - Verify X-Content-Type-Options

## API Testing

You can use tools like Postman or curl to test the API endpoints. Here are some example curl commands:

### Authentication

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"securepassword","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"securepassword"}'

# Get user profile
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Xero Integration

```bash
# List Xero tenants
curl -X GET http://localhost:3000/api/xero/tenants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# List Xero invoices
curl -X GET http://localhost:3000/api/xero/invoices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Bookkeeping

```bash
# List transaction categories
curl -X GET http://localhost:3000/api/bookkeeping/categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Categorize transaction
curl -X POST http://localhost:3000/api/bookkeeping/categorize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bankTransactionId":"transaction123","categoryId":"category123"}'
```

### Financial Analysis

```bash
# Get financial KPIs
curl -X GET http://localhost:3000/api/analysis/kpis \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get cash flow forecast
curl -X GET http://localhost:3000/api/analysis/cash-flow/forecast \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### n8n Integration

```bash
# Get financial KPIs for n8n
curl -X GET http://localhost:3000/api/n8n/kpis \
  -H "X-API-Key: YOUR_API_KEY"

# Get overdue invoices for n8n
curl -X GET http://localhost:3000/api/n8n/invoices/overdue \
  -H "X-API-Key: YOUR_API_KEY"
```

## Performance Testing

To test the performance of the application:

1. Install Artillery:
   ```
   npm install -g artillery
   ```

2. Create a test scenario file (e.g., `performance-test.yml`):
   ```yaml
   config:
     target: "http://localhost:3000"
     phases:
       - duration: 60
         arrivalRate: 5
         rampTo: 20
         name: "Warm up phase"
       - duration: 120
         arrivalRate: 20
         name: "Sustained load phase"
     defaults:
       headers:
         Authorization: "Bearer YOUR_JWT_TOKEN"
   
   scenarios:
     - name: "Get financial KPIs"
       flow:
         - get:
             url: "/api/analysis/kpis"
     - name: "Get cash flow forecast"
       flow:
         - get:
             url: "/api/analysis/cash-flow/forecast"
     - name: "List invoices"
       flow:
         - get:
             url: "/api/xero/invoices"
   ```

3. Run the performance test:
   ```
   artillery run performance-test.yml
   ```

## Integration Testing with n8n

To test the integration with n8n:

1. Install n8n:
   ```
   npm install -g n8n
   ```

2. Start n8n:
   ```
   n8n start
   ```

3. Import the workflow templates from the `n8n_workflows` directory.

4. Configure the workflows with your API endpoint and API key.

5. Execute the workflows and verify the results.

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check that your JWT token is valid and not expired
   - Verify that your Xero OAuth tokens are valid
   - Ensure your API key is correct for n8n endpoints

2. **Xero API Errors**
   - Verify your Xero API credentials
   - Check that your Xero app has the required scopes
   - Ensure your Xero account has the necessary permissions

3. **Database Connection Issues**
   - Verify your database connection string
   - Check that the database exists and is accessible
   - Ensure the database user has the necessary permissions

4. **Rate Limiting**
   - If you encounter 429 errors, wait for the rate limit to reset
   - Check the Retry-After header for the reset time
   - Consider reducing the frequency of requests

### Debugging

The application includes detailed logging to help with debugging:

```
# Set log level to debug
LOG_LEVEL=debug npm start
```

Check the logs for error messages and stack traces.

## Reporting Issues

If you encounter issues during testing, please report them with:

1. A clear description of the issue
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Relevant logs or error messages
6. Environment details (OS, Node.js version, etc.)

## Test Coverage

The application aims for at least 80% test coverage. You can check the current coverage with:

```
npm test -- --coverage
```

This will generate a coverage report in the `coverage` directory.
