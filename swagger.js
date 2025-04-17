/**
 * Swagger/OpenAPI configuration
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Xero CFO Assistant Agent API',
      version: '1.0.0',
      description: 'API documentation for the Xero Accounting & CFO Assistant Agent',
      contact: {
        name: 'Support',
        email: 'support@xerocfoassistant.com'
      },
      license: {
        name: 'Private',
        url: 'https://xerocfoassistant.com/license'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-KEY'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'], // Path to the API routes files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
