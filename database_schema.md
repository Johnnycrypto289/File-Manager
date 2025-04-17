# Xero Accounting & CFO Assistant Agent - Database Schema Design

## 1. Overview

This document outlines the database schema design for the Xero Accounting & CFO Assistant Agent. It provides detailed specifications for tables, relationships, indexes, and data types to support the application's persistence requirements.

## 2. Database Technology Selection

### 2.1 Development Environment
- **Database**: SQLite
- **ORM**: Sequelize
- **Migration Tool**: Sequelize CLI

### 2.2 Production Environment Options
- **Primary Option**: PostgreSQL
- **Alternative**: MySQL
- **ORM**: Sequelize (same as development)
- **Migration Tool**: Sequelize CLI (same as development)

## 3. Entity Relationship Diagram

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
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ ApiKey        │       │ Webhook       │       │ AuditLog      │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ id            │       │ id            │       │ id            │
│ userId        │       │ userId        │       │ userId        │
│ name          │       │ tenantId      │       │ tenantId      │
│ key           │       │ event         │       │ action        │
│ permissions   │       │ url           │       │ details       │
│ expiresAt     │       │ secret        │       │ ipAddress     │
│ createdAt     │       │ createdAt     │       │ createdAt     │
│ updatedAt     │       │ updatedAt     │       └───────────────┘
└───────────────┘       └───────────────┘
```

## 4. Table Definitions

### 4.1 User Table

Stores user account information and authentication details.

#### Schema
```sql
CREATE TABLE "Users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(100),
  "lastName" VARCHAR(100),
  "role" VARCHAR(50) NOT NULL DEFAULT 'Standard',
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Standard',
      validate: {
        isIn: [['Admin', 'Standard', 'ReadOnly', 'Accountant', 'Executive']]
      }
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  User.associate = (models) => {
    User.hasMany(models.UserTenant, { foreignKey: 'userId' });
    User.hasMany(models.XeroToken, { foreignKey: 'userId' });
    User.hasMany(models.CategoryRule, { foreignKey: 'userId' });
    User.hasMany(models.Report, { foreignKey: 'userId' });
    User.hasMany(models.ApiKey, { foreignKey: 'userId' });
    User.hasMany(models.Webhook, { foreignKey: 'userId' });
    User.hasMany(models.AuditLog, { foreignKey: 'userId' });
  };

  return User;
};
```

### 4.2 XeroTenant Table

Stores information about Xero organizations connected to the system.

#### Schema
```sql
CREATE TABLE "XeroTenants" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tenantId" VARCHAR(255) NOT NULL UNIQUE,
  "tenantName" VARCHAR(255) NOT NULL,
  "tenantType" VARCHAR(50) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const XeroTenant = sequelize.define('XeroTenant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    tenantName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tenantType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['Organization', 'Practice', 'XeroHQ']]
      }
    }
  }, {
    timestamps: true
  });

  XeroTenant.associate = (models) => {
    XeroTenant.hasMany(models.UserTenant, { foreignKey: 'tenantId' });
    XeroTenant.hasMany(models.XeroToken, { foreignKey: 'tenantId' });
    XeroTenant.hasMany(models.CategoryRule, { foreignKey: 'tenantId' });
    XeroTenant.hasMany(models.Transaction, { foreignKey: 'tenantId' });
    XeroTenant.hasMany(models.Report, { foreignKey: 'tenantId' });
    XeroTenant.hasMany(models.Webhook, { foreignKey: 'tenantId' });
    XeroTenant.hasMany(models.AuditLog, { foreignKey: 'tenantId' });
  };

  return XeroTenant;
};
```

### 4.3 XeroToken Table

Stores encrypted OAuth tokens for Xero API access.

#### Schema
```sql
CREATE TABLE "XeroTokens" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "tenantId" UUID NOT NULL REFERENCES "XeroTenants"("id") ON DELETE CASCADE,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "tenantId")
);
```

#### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const XeroToken = sequelize.define('XeroToken', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'XeroTenants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'tenantId']
      }
    ]
  });

  XeroToken.associate = (models) => {
    XeroToken.belongsTo(models.User, { foreignKey: 'userId' });
    XeroToken.belongsTo(models.XeroTenant, { foreignKey: 'tenantId' });
  };

  return XeroToken;
};
```

### 4.4 UserTenant Table

Maps users to Xero tenants and tracks active tenant selection.

#### Schema
```sql
CREATE TABLE "UserTenants" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "tenantId" UUID NOT NULL REFERENCES "XeroTenants"("id") ON DELETE CASCADE,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "tenantId")
);
```

#### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const UserTenant = sequelize.define('UserTenant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'XeroTenants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'tenantId']
      }
    ]
  });

  UserTenant.associate = (models) => {
    UserTenant.belongsTo(models.User, { foreignKey: 'userId' });
    UserTenant.belongsTo(models.XeroTenant, { foreignKey: 'tenantId' });
  };

  return UserTenant;
};
```

### 4.5 CategoryRule Table

Stores rules for automatic transaction categorization.

#### Schema
```sql
CREATE TABLE "CategoryRules" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "tenantId" UUID NOT NULL REFERENCES "XeroTenants"("id") ON DELETE CASCADE,
  "pattern" VARCHAR(255) NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "accountCode" VARCHAR(50),
  "priority" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const CategoryRule = sequelize.define('CategoryRule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'XeroTenants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    pattern: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    accountCode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['pattern']
      },
      {
        fields: ['userId', 'tenantId']
      }
    ]
  });

  CategoryRule.associate = (models) => {
    CategoryRule.belongsTo(models.User, { foreignKey: 'userId' });
    CategoryRule.belongsTo(models.XeroTenant, { foreignKey: 'tenantId' });
  };

  return CategoryRule;
};
```

### 4.6 Transaction Table

Caches transaction data from Xero for faster access and categorization.

#### Schema
```sql
CREATE TABLE "Transactions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tenantId" UUID NOT NULL REFERENCES "XeroTenants"("id") ON DELETE CASCADE,
  "xeroId" VARCHAR(255) NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "contactId" VARCHAR(255),
  "contactName" VARCHAR(255),
  "reference" VARCHAR(255),
  "amount" DECIMAL(19,4) NOT NULL,
  "date" DATE NOT NULL,
  "dueDate" DATE,
  "status" VARCHAR(50) NOT NULL,
  "category" VARCHAR(100),
  "accountCode" VARCHAR(50),
  "description" TEXT,
  "isReconciled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", "xeroId")
);
```

#### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'XeroTenants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    xeroId: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['INVOICE', 'BILL', 'SPEND', 'RECEIVE', 'TRANSFER', 'CREDIT_NOTE', 'PAYMENT']]
      }
    },
    contactId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    contactName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    reference: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    accountCode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isReconciled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['tenantId', 'xeroId']
      },
      {
        fields: ['date']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['isReconciled']
      }
    ]
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.XeroTenant, { foreignKey: 'tenantId' });
  };

  return Transaction;
};
```

### 4.7 Report Table

Stores generated financial reports and analysis.

#### Schema
```sql
CREATE TABLE "Reports" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tenantId" UUID NOT NULL REFERENCES "XeroTenants"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "type" VARCHAR(50) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "parameters" JSONB,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'XeroTenants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['PROFIT_LOSS', 'BALANCE_SHEET', 'CASH_FLOW', 'AGED_RECEIVABLES', 'AGED_PAYABLES', 'BUDGET_VARIANCE', 'KPI_DASHBOARD', 'CUSTOM']]
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    parameters: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['tenantId', 'type']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  Report.associate = (models) => {
    Report.belongsTo(models.XeroTenant, { foreignKey: 'tenantId' });
    Report.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Report;
};
```

### 4.8 ApiKey Table

Stores API keys for n8n and external service integration.

#### Schema
```sql
CREATE TABLE "ApiKeys" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "key" VARCHAR(255) NOT NULL UNIQUE,
  "permissions" JSONB NOT NULL,
  "expiresAt" TIMESTAMP,
  "lastUsedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const ApiKey = sequelize.define('ApiKey', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['key']
      },
      {
        fields: ['userId']
      }
    ]
  });

  ApiKey.associate = (models) => {
    ApiKey.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return ApiKey;
};
```

### 4.9 Webhook Table

Stores webhook configurations for event notifications.

#### Schema
```sql
CREATE TABLE "Webhooks" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "tenantId" UUID NOT NULL REFERENCES "XeroTenants"("id") ON DELETE CASCADE,
  "event" VARCHAR(100) NOT NULL,
  "url" VARCHAR(255) NOT NULL,
  "secret" VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const Webhook = sequelize.define('Webhook', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'XeroTenants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    event: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    secret: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['event']
      },
      {
        fields: ['userId', 'tenantId']
      }
    ]
  });

  Webhook.associate = (models) => {
    Webhook.belongsTo(models.User, { foreignKey: 'userId' });
    Webhook.belongsTo(models.XeroTenant, { foreignKey: 'tenantId' });
  };

  return Webhook;
};
```

### 4.10 AuditLog Table

Tracks user actions and system events for security and compliance.

#### Schema
```sql
CREATE TABLE "AuditLogs" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES "Users"("id") ON DELETE SET NULL,
  "tenantId" UUID REFERENCES "XeroTenants"("id") ON DELETE SET NULL,
  "action" VARCHAR(100) NOT NULL,
  "details" JSONB,
  "ipAddress" VARCHAR(45),
  "userAgent" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Sequelize Model
```javascript
module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'XeroTenants',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['action']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['tenantId']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'userId' });
    AuditLog.belongsTo(models.XeroTenant, { foreignKey: 'tenantId' });
  };

  return AuditLog;
};
```

## 5. Database Migrations

### 5.1 Migration Strategy

1. **Initial Schema Creation**: Create all tables with core fields
2. **Incremental Updates**: Add new fields or tables as needed
3. **Version Control**: Track all migrations in version control
4. **Rollback Support**: Implement down migrations for rollbacks

### 5.2 Sample Migration File

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      passwordHash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      lastName: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      role: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Standard'
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('Users', ['email']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};
```

## 6. Data Access Layer

### 6.1 Repository Pattern

Implement a repository pattern to abstract database access:

```javascript
// src/repositories/userRepository.js
const { User, UserTenant, XeroTenant } = require('../models');

class UserRepository {
  async findById(id) {
    return User.findByPk(id);
  }

  async findByEmail(email) {
    return User.findOne({ where: { email } });
  }

  async create(userData) {
    return User.create(userData);
  }

  async update(id, userData) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return user.update(userData);
  }

  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) return false;
    await user.destroy();
    return true;
  }

  async getUserTenants(userId) {
    return UserTenant.findAll({
      where: { userId },
      include: [{ model: XeroTenant }]
    });
  }

  async getActiveTenant(userId) {
    return UserTenant.findOne({
      where: { userId, isActive: true },
      include: [{ model: XeroTenant }]
    });
  }

  async setActiveTenant(userId, tenantId) {
    // First, set all tenants to inactive
    await UserTenant.update(
      { isActive: false },
      { where: { userId } }
    );
    
    // Then set the specified tenant to active
    const userTenant = await UserTenant.findOne({
      where: { userId, tenantId }
    });
    
    if (userTenant) {
      return userTenant.update({ isActive: true });
    }
    
    return null;
  }
}

module.exports = new UserRepository();
```

### 6.2 Service Layer

Implement a service layer to handle business logic:

```javascript
// src/services/userService.js
const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const { generateToken } = require('../utils/jwt');

class UserService {
  async registerUser(userData) {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);
    
    // Create user
    const user = await userRepository.create({
      email: userData.email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'Standard' // Default role
    });
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
  }
  
  async loginUser(email, password) {
    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Update last login
    await user.update({ lastLoginAt: new Date() });
    
    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  }
  
  async getUserProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const tenants = await userRepository.getUserTenants(userId);
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenants: tenants.map(ut => ({
        id: ut.XeroTenant.id,
        tenantId: ut.XeroTenant.tenantId,
        tenantName: ut.XeroTenant.tenantName,
        isActive: ut.isActive
      }))
    };
  }
}

module.exports = new UserService();
```

## 7. Data Security

### 7.1 Encryption

Sensitive data like OAuth tokens should be encrypted before storage:

```javascript
// src/utils/encryption.js
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
  encrypt,
  decrypt
};
```

### 7.2 Password Hashing

User passwords should be hashed using bcrypt:

```javascript
// src/utils/password.js
const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  verifyPassword
};
```

## 8. Database Initialization

### 8.1 Sequelize Initialization

```javascript
// src/models/index.js
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/database')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
```

### 8.2 Database Configuration

```javascript
// src/config/database.js
module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: console.log
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
};
```

## 9. Database Performance Considerations

### 9.1 Indexing Strategy

- Primary keys on all tables
- Foreign key indexes for relationships
- Indexes on frequently queried fields
- Composite indexes for common query patterns
- Text search indexes for pattern matching

### 9.2 Query Optimization

- Use eager loading to avoid N+1 queries
- Implement pagination for large result sets
- Use transactions for data integrity
- Implement query caching for frequent queries
- Monitor and optimize slow queries

### 9.3 Connection Pooling

```javascript
// Connection pool configuration
const config = {
  development: {
    // ...other config
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    // ...other config
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

## 10. Data Migration and Seeding

### 10.1 Seed Data

```javascript
// src/seeders/20250417000000-demo-user.js
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    return queryInterface.bulkInsert('Users', [{
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'Admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', {
      email: 'admin@example.com'
    });
  }
};
```

### 10.2 Data Migration Scripts

```javascript
// src/scripts/migrateData.js
const { sequelize, User, XeroTenant } = require('../models');
const logger = require('../utils/logger');

async function migrateData() {
  try {
    logger.info('Starting data migration');
    
    // Run migrations
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    // Run custom migration logic
    // ...
    
    logger.info('Data migration completed successfully');
  } catch (error) {
    logger.error('Data migration failed:', error);
    process.exit(1);
  }
}

migrateData();
```

## 11. Database Backup and Recovery

### 11.1 Backup Strategy

```javascript
// src/scripts/backup.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const backupDir = path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.sqlite`);
  
  return new Promise((resolve, reject) => {
    exec(`sqlite3 database.sqlite ".backup '${backupFile}'"`, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Backup failed: ${error.message}`);
        reject(error);
        return;
      }
      logger.info(`Database backup created: ${backupFile}`);
      resolve(backupFile);
    });
  });
}

module.exports = {
  backupDatabase
};
```

### 11.2 Recovery Strategy

```javascript
// src/scripts/restore.js
const { exec } = require('child_process');
const logger = require('../utils/logger');

async function restoreDatabase(backupFile) {
  return new Promise((resolve, reject) => {
    exec(`sqlite3 database.sqlite ".restore '${backupFile}'"`, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Restore failed: ${error.message}`);
        reject(error);
        return;
      }
      logger.info(`Database restored from: ${backupFile}`);
      resolve();
    });
  });
}

module.exports = {
  restoreDatabase
};
```

## 12. Conclusion

This database schema design provides a comprehensive foundation for the Xero Accounting & CFO Assistant Agent. It supports all the required functionality including user management, Xero integration, transaction processing, financial analysis, and n8n integration. The schema is designed for performance, security, and scalability, with appropriate indexes, relationships, and data types.

The implementation includes models, repositories, services, and utilities for working with the database, as well as strategies for migration, seeding, backup, and recovery. This design can be implemented in both development (SQLite) and production (PostgreSQL) environments using Sequelize ORM.
