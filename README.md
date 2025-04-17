# Xero CFO Assistant Agent

A comprehensive AI-powered agent that wraps the Xero API to provide accounting and CFO assistant capabilities. This system automates bookkeeping tasks, provides financial analysis, and integrates with n8n for workflow automation.

## Features

- **Xero API Integration**: Seamless integration with Xero accounting platform
- **Automated Bookkeeping**: Bank reconciliation, transaction categorization, invoice automation
- **Financial Analysis**: KPI calculation, cash flow forecasting, anomaly detection
- **n8n Integration**: API endpoints and webhooks for workflow automation
- **Security**: Comprehensive security measures including input validation, CSRF protection, rate limiting, and data encryption

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Xero Developer account with API credentials
- n8n instance (optional, for workflow automation)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/xero-cfo-assistant.git
   cd xero-cfo-assistant
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the provided `.env.example`:
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your Xero API credentials and other configuration options.

5. Initialize the database:
   ```
   node scripts/init-db.js
   ```

6. Start the application:
   ```
   npm start
   ```

## Xero OAuth Setup

To connect with Xero, you need to set up OAuth 2.0 authentication:

1. Create a Xero application at [developer.xero.com](https://developer.xero.com/app/manage)
2. Set the redirect URI to `https://your-app-url.com/api/auth/xero/callback`
3. Copy the Client ID and Client Secret to your `.env` file
4. Update the `XERO_REDIRECT_URI` in your `.env` file to match your application URL

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode (development, production) | development |
| PORT | Server port | 3000 |
| JWT_SECRET | Secret key for JWT tokens | (required) |
| JWT_EXPIRY | JWT token expiry time | 24h |
| XERO_CLIENT_ID | Xero OAuth Client ID | (required) |
| XERO_CLIENT_SECRET | Xero OAuth Client Secret | (required) |
| XERO_REDIRECT_URI | Xero OAuth Redirect URI | (required) |
| DATABASE_URL | Database connection URL | sqlite:./database.sqlite |
| ENCRYPTION_KEY | Key for encrypting sensitive data | (required) |
| LOG_LEVEL | Logging level | info |
| RATE_LIMIT_WINDOW_MS | Rate limiting window in milliseconds | 900000 |
| RATE_LIMIT_MAX | Maximum requests per window | 100 |
| WEBHOOK_SECRET | Secret for webhook signatures | (required) |

## API Documentation

The API is organized around RESTful principles. It accepts JSON request bodies, returns JSON responses, and uses standard HTTP response codes.

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/xero` - Initiate Xero OAuth flow
- `GET /api/auth/xero/callback` - Handle Xero OAuth callback
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Xero Integration Endpoints

- `GET /api/xero/tenants` - List connected Xero tenants
- `GET /api/xero/contacts` - List Xero contacts
- `GET /api/xero/accounts` - List Xero accounts
- `GET /api/xero/invoices` - List Xero invoices
- `GET /api/xero/bills` - List Xero bills
- `GET /api/xero/bank-transactions` - List Xero bank transactions

### Bookkeeping Endpoints

- `POST /api/bookkeeping/reconcile` - Reconcile bank transactions
- `POST /api/bookkeeping/categorize` - Categorize transactions
- `GET /api/bookkeeping/categories` - List transaction categories
- `POST /api/bookkeeping/categories` - Create transaction category
- `GET /api/bookkeeping/rules` - List categorization rules
- `POST /api/bookkeeping/rules` - Create categorization rule

### Financial Analysis Endpoints

- `GET /api/analysis/kpis` - Get financial KPIs
- `GET /api/analysis/cash-flow/forecast` - Get cash flow forecast
- `GET /api/analysis/anomalies` - Get financial anomalies
- `GET /api/analysis/reports` - List financial reports
- `GET /api/analysis/reports/:id` - Get specific financial report

### n8n Integration Endpoints

- `GET /api/n8n/kpis` - Get financial KPIs for n8n
- `GET /api/n8n/cash-flow/forecast` - Get cash flow forecast for n8n
- `GET /api/n8n/cash-flow/issues` - Get cash flow issues for n8n
- `GET /api/n8n/anomalies` - Get financial anomalies for n8n
- `POST /api/n8n/transactions/sync` - Sync bank transactions for n8n
- `GET /api/n8n/transactions/:transactionId/matches` - Get transaction matches for n8n
- `POST /api/n8n/transactions/categorize` - Categorize transactions for n8n
- `GET /api/n8n/invoices/overdue` - Get overdue invoices for n8n
- `GET /api/n8n/contacts/:contactId/payment-reminder` - Generate payment reminder for n8n
- `POST /api/n8n/contacts/:contactId/payment-reminder` - Send payment reminder for n8n
- `GET /api/n8n/bills/upcoming` - Get upcoming bill payments for n8n
- `GET /api/n8n/bills/payment-schedule` - Generate payment schedule for n8n

### Webhook Endpoints

- `POST /api/webhooks/xero` - Handle Xero webhook events
- `POST /api/webhooks/register` - Register a new webhook
- `GET /api/webhooks/list` - List registered webhooks
- `PUT /api/webhooks/:webhookId` - Update webhook
- `DELETE /api/webhooks/:webhookId` - Delete webhook
- `POST /api/webhooks/:webhookId/regenerate-secret` - Regenerate webhook secret
- `POST /api/webhooks/:webhookId/test` - Test webhook

## n8n Workflow Templates

The system includes pre-built n8n workflow templates for common automation tasks:

1. **Daily Bank Reconciliation** - Automatically syncs and categorizes bank transactions
2. **Invoice Payment Reminder** - Sends reminders for overdue invoices
3. **Monthly Financial Report** - Generates and distributes monthly financial reports

To use these templates:
1. Import the JSON files from the `n8n_workflows` directory into your n8n instance
2. Update the API endpoint URLs and API keys in the workflow
3. Activate the workflow

## Deployment

### Replit Deployment

1. Create a new Replit project
2. Upload the codebase or connect to your GitHub repository
3. The included `.replit` file will configure the environment
4. Set up the required environment variables in Replit's Secrets tab
5. Run the deployment script: `sh deploy.sh`

### Standard Deployment

1. Ensure Node.js and npm are installed on your server
2. Clone the repository to your server
3. Install dependencies: `npm install --production`
4. Set up environment variables
5. Start the application: `npm start`

For production environments, consider using a process manager like PM2:
```
npm install -g pm2
pm2 start src/app.js --name xero-cfo-assistant
```

## Security

The system implements several security measures:

- **Input Validation**: All incoming requests are validated against defined schemas
- **CSRF Protection**: Cross-Site Request Forgery protection with token verification
- **Rate Limiting**: Prevents abuse and brute force attacks
- **Audit Logging**: Records detailed logs of sensitive operations
- **Data Encryption**: Encrypts sensitive data using AES-256-GCM
- **Secure Headers**: Sets security-related HTTP headers to protect against common vulnerabilities

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Xero API](https://developer.xero.com/)
- [n8n](https://n8n.io/)
- [Express.js](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
