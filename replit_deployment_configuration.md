# Xero Accounting & CFO Assistant Agent - Replit Deployment Configuration

## 1. Overview

This document outlines the configuration requirements and setup process for deploying the Xero Agent application on Replit. It covers environment setup, dependencies, secrets management, persistence configuration, and deployment procedures.

## 2. Replit Environment Configuration

### 2.1 Repl Type and Template

- **Repl Type**: Node.js
- **Template**: Node.js with Express
- **Node Version**: 16.x or higher (specify in `.replit` configuration)

### 2.2 Configuration Files

#### .replit
```toml
entrypoint = "src/app.js"
modules = ["nodejs-16:v1-20230724-46761b9"]

[nix]
channel = "stable-22_11"

[deployment]
run = ["node", "src/app.js"]
deploymentTarget = "cloudrun"

[env]
PORT = "3000"
```

#### replit.nix
```nix
{ pkgs }: {
  deps = [
    pkgs.nodejs-16_x
    pkgs.nodePackages.typescript
    pkgs.yarn
    pkgs.replitPackages.jest
  ];
}
```

#### .gitignore
```
node_modules/
.env
.env.local
.DS_Store
*.log
coverage/
dist/
.replit.backup
.upm/
```

## 3. Dependencies and Package Configuration

### 3.1 Core Dependencies

#### package.json
```json
{
  "name": "xero-accounting-cfo-assistant",
  "version": "1.0.0",
  "description": "Xero Accounting & CFO Assistant Agent",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "express": "^4.18.2",
    "xero-node": "^4.36.0",
    "dotenv": "^16.0.3",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "sequelize": "^6.31.1",
    "sqlite3": "^5.1.6",
    "axios": "^1.4.0",
    "winston": "^3.8.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^6.7.0",
    "swagger-ui-express": "^4.6.3",
    "openapi-types": "^12.1.0",
    "multer": "^1.4.5-lts.1",
    "node-cron": "^3.0.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "eslint": "^8.40.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

### 3.2 Frontend Dependencies (if using a separate frontend build)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.11.1",
    "axios": "^1.4.0",
    "chart.js": "^4.3.0",
    "react-chartjs-2": "^5.2.0",
    "formik": "^2.2.9",
    "yup": "^1.1.1",
    "@mui/material": "^5.13.0",
    "@mui/icons-material": "^5.11.16"
  }
}
```

## 4. Secrets and Environment Variables

### 4.1 Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port for the application to listen on | `3000` |
| `NODE_ENV` | Environment (development, production) | `production` |
| `JWT_SECRET` | Secret for JWT token generation | `your-jwt-secret` |
| `XERO_CLIENT_ID` | Xero OAuth 2.0 client ID | `YOUR_XERO_CLIENT_ID` |
| `XERO_CLIENT_SECRET` | Xero OAuth 2.0 client secret | `YOUR_XERO_CLIENT_SECRET` |
| `XERO_REDIRECT_URI` | OAuth 2.0 redirect URI | `https://xero-agent.your-repl.repl.co/auth/callback` |
| `ENCRYPTION_KEY` | Key for encrypting sensitive data | `your-encryption-key` |
| `DATABASE_URL` | Database connection string (if using external DB) | `sqlite:./database.sqlite` |
| `N8N_WEBHOOK_URL` | URL for n8n webhooks | `https://your-n8n-instance.com/webhook/xero-agent` |
| `N8N_API_KEY` | API key for n8n authentication | `your-n8n-api-key` |
| `ADMIN_EMAIL` | Default admin user email | `admin@example.com` |
| `ADMIN_PASSWORD` | Default admin user password | `securepassword` |

### 4.2 Setting Up Secrets in Replit

1. Navigate to the "Secrets" tab in your Repl
2. Add each environment variable as a secret
3. Secrets are automatically loaded as environment variables

## 5. Database Configuration

### 5.1 SQLite Configuration (Development)

```javascript
// src/config/database.js
const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

module.exports = sequelize;
```

### 5.2 PostgreSQL Configuration (Production Option)

```javascript
// src/config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

module.exports = sequelize;
```

## 6. Persistence Configuration

### 6.1 File Storage

- Use Replit's persistent filesystem for file storage
- Store files in a dedicated directory structure

```javascript
// src/utils/fileStorage.js
const fs = require('fs');
const path = require('path');

const storageDir = path.join(__dirname, '../../storage');

// Ensure storage directories exist
const dirs = ['attachments', 'exports', 'temp'];
dirs.forEach(dir => {
  const dirPath = path.join(storageDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

module.exports = {
  storagePath: storageDir,
  getFilePath: (type, filename) => path.join(storageDir, type, filename)
};
```

### 6.2 Token Storage

- Store encrypted tokens in the database
- Implement token refresh mechanism

```javascript
// src/services/tokenStorage.js
const { XeroToken } = require('../models/xeroToken');
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

const decrypt = (text) => {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = {
  saveToken: async (userId, tenantId, token) => {
    const encryptedToken = encrypt(JSON.stringify(token));
    await XeroToken.upsert({
      userId,
      tenantId,
      tokenData: encryptedToken,
      expiresAt: new Date(token.expires_at * 1000)
    });
  },
  
  getToken: async (userId, tenantId) => {
    const tokenRecord = await XeroToken.findOne({
      where: { userId, tenantId }
    });
    
    if (!tokenRecord) return null;
    
    const tokenData = JSON.parse(decrypt(tokenRecord.tokenData));
    return tokenData;
  }
};
```

## 7. Application Structure for Replit

```
xero-agent/
├── .replit                 # Replit configuration
├── replit.nix              # Nix environment configuration
├── package.json            # Node.js dependencies
├── src/
│   ├── app.js              # Application entry point
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── utils/              # Utility functions
├── public/                 # Static assets
│   ├── css/
│   ├── js/
│   └── images/
├── storage/                # Persistent file storage
│   ├── attachments/
│   ├── exports/
│   └── temp/
├── database.sqlite         # SQLite database file
└── README.md               # Project documentation
```

## 8. Deployment Process

### 8.1 Initial Setup

1. Create a new Repl with Node.js template
2. Upload or create the project files according to the structure above
3. Set up all required secrets in the Replit Secrets panel
4. Install dependencies with `npm install`

### 8.2 Development Workflow

1. Make changes to the code
2. Test locally within Replit using `npm run dev`
3. Commit changes to Replit's version control

### 8.3 Production Deployment

1. Ensure all environment variables are set correctly
2. Run database migrations if needed
3. Start the application with `npm start`
4. Replit will automatically assign a domain (e.g., `https://xero-agent.your-username.repl.co`)

## 9. Monitoring and Maintenance

### 9.1 Logging Configuration

```javascript
// src/utils/logger.js
const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
const fs = require('fs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    })
  ]
});

module.exports = logger;
```

### 9.2 Health Check Endpoint

```javascript
// src/routes/health.js
const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();
    
    // Return health status
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
```

## 10. Scaling Considerations

### 10.1 Replit Limitations

- CPU and memory limits based on Replit plan
- Connection limits and timeout policies
- Storage limitations

### 10.2 Optimization Strategies

- Implement caching for frequently accessed data
- Use efficient database queries
- Optimize API calls to Xero
- Implement background processing for long-running tasks
- Consider external database for production use

## 11. Security Configuration

### 11.1 Express Security Middleware

```javascript
// src/middleware/security.js
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

module.exports = (app) => {
  // Set security headers
  app.use(helmet());
  
  // Configure CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  });
  
  app.use('/api/', apiLimiter);
};
```

### 11.2 HTTPS Configuration

Replit provides HTTPS by default for all Repls, so no additional configuration is needed for HTTPS.

## 12. Troubleshooting Common Issues

### 12.1 Connection Issues

- Verify Replit is not in sleep mode
- Check network connectivity to external services
- Verify firewall settings

### 12.2 Performance Issues

- Monitor memory usage
- Check for memory leaks
- Optimize database queries
- Implement caching

### 12.3 Authentication Issues

- Verify Xero API credentials
- Check token refresh mechanism
- Validate redirect URIs

## 13. Backup and Recovery

### 13.1 Database Backup

```javascript
// src/utils/backup.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const backupDir = path.join(__dirname, '../../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const createBackup = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.sqlite`);
  
  return new Promise((resolve, reject) => {
    exec(`sqlite3 database.sqlite ".backup '${backupFile}'"`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(backupFile);
    });
  });
};

module.exports = {
  createBackup
};
```

### 13.2 Scheduled Backups

```javascript
// src/services/scheduledTasks.js
const cron = require('node-cron');
const { createBackup } = require('../utils/backup');
const logger = require('../utils/logger');

// Schedule daily backup at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const backupFile = await createBackup();
    logger.info(`Database backup created: ${backupFile}`);
  } catch (error) {
    logger.error(`Backup failed: ${error.message}`);
  }
});
```

## 14. Replit-Specific Optimizations

### 14.1 Keep-Alive Configuration

To prevent Replit from putting the application to sleep:

```javascript
// src/utils/keepAlive.js
const axios = require('axios');
const logger = require('./logger');

const pingInterval = 5 * 60 * 1000; // 5 minutes

const startKeepAlive = (url) => {
  setInterval(async () => {
    try {
      await axios.get(url);
      logger.debug('Keep-alive ping successful');
    } catch (error) {
      logger.error(`Keep-alive ping failed: ${error.message}`);
    }
  }, pingInterval);
};

module.exports = { startKeepAlive };
```

### 14.2 Memory Management

```javascript
// src/utils/memoryMonitor.js
const logger = require('./logger');

const memoryThreshold = 0.8; // 80% of available memory

const monitorMemory = () => {
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const usedMemoryPercentage = memoryUsage.heapUsed / memoryUsage.heapTotal;
    
    logger.debug(`Memory usage: ${(usedMemoryPercentage * 100).toFixed(2)}%`);
    
    if (usedMemoryPercentage > memoryThreshold) {
      logger.warn(`High memory usage: ${(usedMemoryPercentage * 100).toFixed(2)}%`);
      // Optionally trigger garbage collection or other memory optimization
    }
  }, 60000); // Check every minute
};

module.exports = { monitorMemory };
```

## 15. Deployment Checklist

- [ ] All required environment variables are set in Replit Secrets
- [ ] Database migrations are applied
- [ ] Static assets are properly served
- [ ] API endpoints are accessible
- [ ] Authentication flow is working
- [ ] Xero OAuth integration is configured
- [ ] n8n webhook URLs are set up
- [ ] Logging is properly configured
- [ ] Health check endpoint is responding
- [ ] Backup mechanism is in place
- [ ] Keep-alive mechanism is active
- [ ] Memory monitoring is enabled
- [ ] Security middleware is configured
