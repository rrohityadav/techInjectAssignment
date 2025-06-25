export const swaggerOptions = {
  swagger: {
    info: {
      title: 'Order & Inventory Service API',
      description: 'API documentation for the Order & Inventory Service',
      version: '1.0.0',
    },
    externalDocs: {
      url: 'https://swagger.io',
      description: 'Find more info here',
    },
    host: 'localhost:3000', // TODO: Make this dynamic based on environment
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      { name: 'Product', description: 'Product related end-points' },
      { name: 'Order', description: 'Order related end-points' },
      { name: 'Health', description: 'Health check end-points' },
    ],
    // TODO: Add security definitions if authentication is implemented
    // securityDefinitions: {
    //   apiKey: {
    //     type: 'apiKey',
    //     name: 'apiKey',
    //     in: 'header',
    //   },
    // },
  },
};

export const swaggerUiOptions = {
  routePrefix: '/documentation',
  exposeRoute: true,
};
