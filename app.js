/**
 * Xero Accounting & CFO Assistant Agent
 * Main application file
 */

// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');
const path = require('path');

// Create Express app
const app = express();

// Import configuration
const config = require('./config');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const xeroRoutes = require('./routes/xero');
const bookkeepingRoutes = require('./routes/bookkeeping');
const analysisRoutes = require('./routes/analysis');
const n8nRoutes = require('./routes/n8n');

// Configure middleware
app.use(helmet()); // Set security headers
app.use(cors()); // Enable CORS
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Request logging
app.use(requestLogger);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/xero', xeroRoutes);
app.use('/api/bookkeeping', bookkeepingRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/n8n', n8nRoutes);

// API documentation
const swaggerDocument = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export app for testing
module.exports = app;
