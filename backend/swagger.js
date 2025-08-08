const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Auth API',
            version: '1.0.0',
            description: 'Authentication API Documentation',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
    },
    // Try these different patterns one by one:
    apis: [path.join(__dirname, './controllers/userController.js'), path.join(__dirname, './controllers/phoneController.js'), path.join(__dirname, './controllers/orderController.js'),
        path.join(__dirname, './controllers/cartController.js')
    ]

};

const specs = swaggerJsdoc(options);

// Enhanced debug logging
console.log('Scanning files from:', path.resolve(__dirname, '../controllers'));
console.log('Generated Swagger Spec:', JSON.stringify(specs, null, 2));

module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        swaggerOptions: {
            validatorUrl: null
        }
    }));
};
