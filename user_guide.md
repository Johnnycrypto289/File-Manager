# User Guide

This document provides a comprehensive guide for using the Xero CFO Assistant Agent to automate bookkeeping tasks, analyze financial data, and integrate with workflow automation tools.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Xero Integration](#xero-integration)
5. [Bookkeeping Automation](#bookkeeping-automation)
6. [Financial Analysis](#financial-analysis)
7. [n8n Integration](#n8n-integration)
8. [User Management](#user-management)
9. [Settings](#settings)
10. [Troubleshooting](#troubleshooting)

## Introduction

The Xero CFO Assistant Agent is an AI-powered tool that connects to your Xero accounting platform to automate bookkeeping tasks, provide financial insights, and integrate with n8n for workflow automation. It helps businesses save time on accounting tasks, improve financial visibility, and make better business decisions.

### Key Features

- **Automated Bookkeeping**: Bank reconciliation, transaction categorization, invoice management
- **Financial Analysis**: KPI tracking, cash flow forecasting, anomaly detection
- **n8n Integration**: Workflow automation for accounting tasks
- **Secure Access**: Role-based access control and data encryption

## Getting Started

### First Login

1. After your administrator has created your account, you'll receive an email with login instructions.
2. Navigate to the login page and enter your email and temporary password.
3. You'll be prompted to change your password on first login.
4. Once logged in, you'll be guided through a setup wizard to connect your Xero account.

### Connecting to Xero

1. From the dashboard, click "Connect to Xero" or navigate to Settings > Xero Integration.
2. Click "Connect" to initiate the Xero OAuth flow.
3. You'll be redirected to Xero to authorize the application.
4. Select the organization(s) you want to connect.
5. After authorization, you'll be redirected back to the application.
6. If you have multiple Xero organizations, select which one to use as the active organization.

## Dashboard Overview

The dashboard provides a quick overview of your financial status and recent activity.

### Key Components

- **Financial Health Score**: Overall score based on profitability, liquidity, and efficiency metrics
- **Cash Position**: Current bank balances and projected cash position
- **Upcoming Payments**: Bills due in the next 30 days
- **Overdue Invoices**: Summary of overdue customer invoices
- **Recent Transactions**: Latest bank transactions requiring attention
- **Financial Anomalies**: Unusual financial patterns detected

### Navigation

The main navigation menu includes:

- **Dashboard**: Overview of financial status
- **Bookkeeping**: Bank reconciliation, transaction categorization, invoices, bills
- **Analysis**: Financial KPIs, cash flow forecasting, reports
- **n8n Integration**: Workflow automation settings
- **Settings**: User profile, Xero connection, system settings

## Xero Integration

### Managing Xero Connections

1. Navigate to Settings > Xero Integration.
2. View connected Xero organizations.
3. Set the active organization.
4. Reconnect to Xero if needed.
5. View connection status and last sync time.

### Data Synchronization

The system automatically syncs data from Xero at regular intervals:

- Contacts: Daily
- Accounts: Daily
- Invoices: Hourly
- Bills: Hourly
- Bank Transactions: Every 15 minutes

To manually sync data:

1. Navigate to Settings > Xero Integration.
2. Click "Sync Now" for the specific data type.
3. Wait for the sync to complete.

## Bookkeeping Automation

### Bank Reconciliation

The system helps automate bank reconciliation by matching bank transactions with invoices and bills.

To reconcile transactions:

1. Navigate to Bookkeeping > Bank Reconciliation.
2. Review the list of unreconciled transactions.
3. For each transaction, the system suggests possible matches.
4. Select the correct match or manually search for a match.
5. Click "Reconcile" to confirm the match.
6. For transactions without matches, you can create a new transaction or categorize as needed.

### Transaction Categorization

Categorizing transactions helps with financial reporting and analysis.

To categorize transactions:

1. Navigate to Bookkeeping > Transactions.
2. Filter for uncategorized transactions.
3. Select a transaction and choose a category from the dropdown.
4. Click "Save" to apply the category.

To set up automatic categorization rules:

1. Navigate to Bookkeeping > Categories > Rules.
2. Click "Add Rule".
3. Enter a rule name.
4. Define the pattern to match (e.g., "Staples|Office Depot").
5. Select the category to apply.
6. Set the rule as active.
7. Click "Save".

### Invoice Management

The system helps track and manage invoices:

1. Navigate to Bookkeeping > Invoices.
2. View all invoices with their status (Draft, Sent, Overdue, Paid).
3. Filter invoices by status, date, or customer.
4. Click on an invoice to view details.
5. For overdue invoices, you can send payment reminders directly from the system.

To send a payment reminder:

1. Select an overdue invoice.
2. Click "Send Reminder".
3. Choose a reminder template.
4. Preview and edit the reminder email.
5. Click "Send" to deliver the reminder.

### Bill Management

The system helps track and manage bills:

1. Navigate to Bookkeeping > Bills.
2. View all bills with their status (Draft, Awaiting Payment, Paid).
3. Filter bills by status, date, or supplier.
4. Click on a bill to view details.
5. For upcoming bills, you can schedule payments.

To schedule a payment:

1. Select a bill.
2. Click "Schedule Payment".
3. Select the payment date.
4. Choose the payment method.
5. Click "Save" to schedule the payment.

## Financial Analysis

### KPI Dashboard

The KPI dashboard provides key financial metrics:

1. Navigate to Analysis > KPIs.
2. View profitability metrics (Gross Profit Margin, Net Profit Margin).
3. View liquidity metrics (Current Ratio, Quick Ratio).
4. View efficiency metrics (Days Sales Outstanding, Days Payable Outstanding).
5. Compare current metrics with previous periods.
6. Export KPI data to CSV or PDF.

### Cash Flow Forecasting

The cash flow forecast predicts your future cash position:

1. Navigate to Analysis > Cash Flow.
2. View the projected cash balance for the next 90 days.
3. See detailed inflows and outflows by month.
4. Identify potential cash shortfalls.
5. Adjust the forecast period (30, 60, 90, or 180 days).
6. Export the forecast to CSV or PDF.

### Anomaly Detection

The system automatically detects unusual financial patterns:

1. Navigate to Analysis > Anomalies.
2. View detected anomalies with severity levels.
3. Click on an anomaly to see details and recommendations.
4. Mark anomalies as reviewed or ignored.
5. Adjust anomaly detection sensitivity in Settings.

### Financial Reports

The system generates various financial reports:

1. Navigate to Analysis > Reports.
2. Select a report type (Monthly, Quarterly, Annual).
3. Choose the reporting period.
4. Click "Generate" to create the report.
5. View the report online or download as PDF.

Available report types:

- Monthly Financial Summary
- Cash Flow Statement
- Profit & Loss
- Balance Sheet
- Aged Receivables
- Aged Payables
- Expense Breakdown

## n8n Integration

The system integrates with n8n for workflow automation.

### Setting Up n8n Connection

1. Navigate to n8n Integration > Settings.
2. Generate an API key for n8n.
3. Copy the API key and API base URL.
4. In your n8n instance, use these credentials to connect to the Xero CFO Assistant Agent.

### Importing Workflow Templates

The system includes pre-built n8n workflow templates:

1. Navigate to n8n Integration > Workflows.
2. Select a workflow template to download.
3. In your n8n instance, import the downloaded JSON file.
4. Configure the workflow with your API key and customize as needed.
5. Activate the workflow in n8n.

Available workflow templates:

- Daily Bank Reconciliation
- Invoice Payment Reminders
- Monthly Financial Report
- Cash Flow Alerts
- Anomaly Detection Notifications

### Webhook Configuration

You can set up webhooks to trigger actions in external systems:

1. Navigate to n8n Integration > Webhooks.
2. Click "Add Webhook".
3. Enter a name for the webhook.
4. Enter the destination URL.
5. Select the events to trigger the webhook.
6. Click "Save" to create the webhook.
7. Copy the webhook secret for authentication.

## User Management

### User Profile

To update your profile:

1. Click your username in the top-right corner.
2. Select "Profile".
3. Update your name, email, or password.
4. Click "Save" to apply changes.

### Managing Users (Admin Only)

If you have administrator privileges:

1. Navigate to Settings > Users.
2. View all users in the system.
3. Click "Add User" to create a new user.
4. Enter the user's email, name, and role.
5. Click "Save" to create the user.

To edit a user:

1. Click on the user in the list.
2. Update their information or role.
3. Click "Save" to apply changes.

To deactivate a user:

1. Click on the user in the list.
2. Click "Deactivate".
3. Confirm the deactivation.

### Roles and Permissions

The system includes several roles with different permissions:

- **Administrator**: Full access to all features and settings
- **Manager**: Access to all features except user management and system settings
- **Accountant**: Access to bookkeeping and financial analysis features
- **Viewer**: Read-only access to financial data

## Settings

### General Settings

1. Navigate to Settings > General.
2. Configure system-wide settings:
   - Default currency
   - Date format
   - Financial year start month
   - Default report type
   - Email notification preferences

### Security Settings

1. Navigate to Settings > Security.
2. Configure security settings:
   - Password policy
   - Session timeout
   - Two-factor authentication
   - API key management

### Notification Settings

1. Navigate to Settings > Notifications.
2. Configure notification preferences:
   - Email notifications
   - In-app notifications
   - Alert thresholds for cash flow
   - Alert thresholds for overdue invoices

## Troubleshooting

### Common Issues

#### Xero Connection Issues

If you encounter issues with the Xero connection:

1. Navigate to Settings > Xero Integration.
2. Check the connection status.
3. If disconnected, click "Reconnect" to initiate the OAuth flow again.
4. If still having issues, check that your Xero user has the necessary permissions.

#### Data Synchronization Issues

If data is not syncing correctly:

1. Navigate to Settings > Xero Integration.
2. Check the last sync time for each data type.
3. Click "Sync Now" to manually trigger a sync.
4. Check the sync logs for any errors.

#### Performance Issues

If the system is running slowly:

1. Check your internet connection.
2. Clear your browser cache.
3. Try using a different browser.
4. If issues persist, contact support.

### Getting Help

For additional help:

1. Click the "Help" icon in the top-right corner.
2. Browse the knowledge base for articles and guides.
3. Use the search function to find specific topics.
4. Click "Contact Support" to submit a support ticket.

## Best Practices

### Daily Tasks

- Check the dashboard for financial anomalies
- Review and reconcile new bank transactions
- Check for overdue invoices and send reminders

### Weekly Tasks

- Review cash flow forecast
- Check upcoming bill payments
- Review KPI trends

### Monthly Tasks

- Generate and review monthly financial reports
- Analyze expense categories for cost-saving opportunities
- Review and update categorization rules

### Quarterly Tasks

- Perform a comprehensive financial review
- Update cash flow projections
- Review user access and permissions
