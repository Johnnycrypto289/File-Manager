# Xero OAuth Flow Walkthrough

This document provides a detailed walkthrough of the OAuth 2.0 authentication flow for connecting the Xero CFO Assistant Agent with Xero accounts.

## Overview

The Xero CFO Assistant Agent uses OAuth 2.0 to securely connect to users' Xero accounts. This allows the agent to access Xero data without requiring users to share their Xero credentials directly with the application.

## Prerequisites

Before starting the OAuth flow, you need:

1. A Xero Developer account
2. A registered Xero application with:
   - Client ID
   - Client Secret
   - Configured redirect URI

## Step 1: Register a Xero Application

1. Go to [Xero Developer Portal](https://developer.xero.com/)
2. Sign in with your Xero account
3. Navigate to "My Apps" and click "New App"
4. Fill in the required information:
   - App Name: "Xero CFO Assistant Agent" (or your preferred name)
   - Company or application URL
   - OAuth 2.0 redirect URI: `https://your-app-url.com/api/auth/xero/callback`
   - Select the required API scopes (minimum required scopes listed below)
5. Save the application

### Required Scopes

The following scopes are required for full functionality:

- `offline_access` - To get a refresh token
- `accounting.transactions` - For bank transactions, invoices, bills
- `accounting.contacts` - For customer and supplier information
- `accounting.settings` - For accounts and chart of accounts
- `accounting.reports` - For financial reports
- `accounting.attachments` - For document attachments

## Step 2: Configure Environment Variables

Update your `.env` file with the Xero application credentials:

```
XERO_CLIENT_ID=your_client_id_here
XERO_CLIENT_SECRET=your_client_secret_here
XERO_REDIRECT_URI=https://your-app-url.com/api/auth/xero/callback
```

## Step 3: OAuth Flow Implementation

The OAuth flow in the Xero CFO Assistant Agent follows these steps:

### 3.1 Initiate OAuth Flow

When a user wants to connect their Xero account, they are directed to the `/api/auth/xero` endpoint, which:

1. Generates a random state parameter for CSRF protection
2. Stores the state in the user's session
3. Redirects the user to the Xero authorization URL with:
   - Client ID
   - Redirect URI
   - State parameter
   - Required scopes

```javascript
// Example code from authController.js
const initiateXeroAuth = (req, res) => {
  // Generate random state
  const state = crypto.randomBytes(16).toString('hex');
  
  // Store state in session
  req.session.xeroState = state;
  
  // Construct authorization URL
  const authUrl = `https://login.xero.com/identity/connect/authorize?` +
    `response_type=code` +
    `&client_id=${process.env.XERO_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.XERO_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(XERO_SCOPES)}` +
    `&state=${state}`;
  
  // Redirect user to Xero authorization page
  res.redirect(authUrl);
};
```

### 3.2 User Authorization

The user is redirected to Xero's authorization page where they:

1. Log in to their Xero account (if not already logged in)
2. Select the organization(s) they want to connect
3. Authorize the requested permissions

### 3.3 Handle Callback

After authorization, Xero redirects the user back to the specified redirect URI (`/api/auth/xero/callback`) with:

1. Authorization code
2. State parameter

The callback handler:

1. Verifies the state parameter matches the one stored in the session
2. Exchanges the authorization code for access and refresh tokens
3. Retrieves connected tenant information
4. Stores the tokens and tenant information in the database
5. Redirects the user back to the application

```javascript
// Example code from authController.js
const handleXeroCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    // Verify state parameter
    if (!state || state !== req.session.xeroState) {
      return res.status(400).send('Invalid state parameter');
    }
    
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://identity.xero.com/connect/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.XERO_REDIRECT_URI
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Get connected tenants
    const tenantsResponse = await axios.get('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Store tokens and tenant information
    await storeXeroTokens(req.user.userId, access_token, refresh_token, expires_in);
    await storeXeroTenants(req.user.userId, tenantsResponse.data);
    
    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error in Xero callback:', error);
    res.status(500).send('Error connecting to Xero');
  }
};
```

## Step 4: Token Management

The Xero CFO Assistant Agent implements token management to handle:

### 4.1 Token Storage

Tokens are securely stored in the database with encryption:

```javascript
// Example code from Token.js model
const Token = sequelize.define('Token', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tokenType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const encrypted = this.getDataValue('accessToken');
      return encrypted ? decrypt(JSON.parse(encrypted)) : null;
    },
    set(value) {
      this.setDataValue('accessToken', JSON.stringify(encrypt(value)));
    }
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const encrypted = this.getDataValue('refreshToken');
      return encrypted ? decrypt(JSON.parse(encrypted)) : null;
    },
    set(value) {
      this.setDataValue('refreshToken', JSON.stringify(encrypt(value)));
    }
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});
```

### 4.2 Token Refresh

The system automatically refreshes tokens when they expire:

```javascript
// Example code from xeroClient.js
const getValidToken = async (userId) => {
  // Get token from database
  const token = await Token.findOne({
    where: {
      userId,
      tokenType: 'XERO'
    }
  });
  
  if (!token) {
    throw new Error('No Xero token found for user');
  }
  
  // Check if token is expired or about to expire
  if (new Date(token.expiresAt) <= new Date(Date.now() + 5 * 60 * 1000)) {
    // Token is expired or expires in less than 5 minutes, refresh it
    return refreshToken(userId, token);
  }
  
  return token.accessToken;
};

const refreshToken = async (userId, token) => {
  try {
    // Exchange refresh token for new access token
    const response = await axios.post('https://identity.xero.com/connect/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );
    
    const { access_token, refresh_token, expires_in } = response.data;
    
    // Update token in database
    await token.update({
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000)
    });
    
    return access_token;
  } catch (error) {
    logger.error('Error refreshing Xero token:', error);
    throw new Error('Failed to refresh Xero token');
  }
};
```

## Step 5: Multi-Tenant Support

The Xero CFO Assistant Agent supports connecting to multiple Xero organizations (tenants):

### 5.1 Tenant Selection

Users can select which tenant to work with:

```javascript
// Example code from xeroController.js
const listTenants = async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Get tenants from database
    const tenants = await XeroTenant.findAll({
      where: { userId }
    });
    
    return res.json({
      success: true,
      data: tenants.map(tenant => ({
        id: tenant.tenantId,
        name: tenant.tenantName,
        isActive: tenant.isActive
      }))
    });
  } catch (error) {
    logger.error('Error listing Xero tenants:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list Xero tenants'
    });
  }
};

const setActiveTenant = async (req, res) => {
  try {
    const { userId } = req.user;
    const { tenantId } = req.params;
    
    // Verify tenant exists
    const tenant = await XeroTenant.findOne({
      where: {
        userId,
        tenantId
      }
    });
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }
    
    // Set all tenants to inactive
    await XeroTenant.update(
      { isActive: false },
      { where: { userId } }
    );
    
    // Set selected tenant to active
    await tenant.update({ isActive: true });
    
    return res.json({
      success: true,
      message: 'Active tenant updated successfully'
    });
  } catch (error) {
    logger.error('Error setting active Xero tenant:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to set active Xero tenant'
    });
  }
};
```

### 5.2 Tenant-Specific API Calls

All API calls include the tenant ID:

```javascript
// Example code from invoicesService.js
const getInvoices = async (userId, tenantId, options = {}) => {
  try {
    // Get valid access token
    const accessToken = await getValidToken(userId);
    
    // Make API request to Xero
    const response = await axios.get(`https://api.xero.com/api.xro/2.0/Invoices`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Xero-Tenant-Id': tenantId,
        'Content-Type': 'application/json'
      },
      params: {
        where: options.where,
        order: options.order,
        page: options.page,
        pageSize: options.pageSize
      }
    });
    
    return response.data.Invoices;
  } catch (error) {
    logger.error('Error getting invoices from Xero:', error);
    throw new Error('Failed to get invoices from Xero');
  }
};
```

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**: Ensure the redirect URI in your Xero app configuration exactly matches the one in your environment variables.

2. **Missing Scopes**: If you're getting permission errors, check that you've requested all the required scopes.

3. **Token Refresh Failures**: If token refresh is failing, verify that your client ID and client secret are correct.

4. **State Mismatch**: If you're getting state parameter errors, check that your session handling is working correctly.

### Debugging

The Xero CFO Assistant Agent includes detailed logging for OAuth-related operations:

```javascript
// Example debug logging
logger.debug('Initiating Xero OAuth flow', { state });
logger.debug('Received Xero callback', { code: code ? '[REDACTED]' : 'missing', state });
logger.debug('Exchanged code for tokens', { expires_in });
```

## Security Considerations

The OAuth implementation includes several security measures:

1. **State Parameter**: Prevents CSRF attacks by validating the state parameter.

2. **Token Encryption**: All tokens are encrypted before being stored in the database.

3. **HTTPS**: All OAuth-related requests use HTTPS.

4. **Token Refresh**: Tokens are automatically refreshed before they expire.

5. **Scoped Access**: Only the minimum required scopes are requested.

## References

- [Xero OAuth 2.0 Documentation](https://developer.xero.com/documentation/oauth2/auth-flow)
- [Xero API Reference](https://developer.xero.com/documentation/api/api-overview)
