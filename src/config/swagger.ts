// src/config/swagger.ts
import { SwaggerOptions as FastifySwaggerOptions } from '@fastify/swagger';

export const swaggerOptions: FastifySwaggerOptions = {
  swagger: {
    info: {
      title: 'Order & Inventory Service API',
      description: 'API documentation for the Order & Inventory Service',
      version: '1.0.0',
    },
    host: 'localhost:3000',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      { name: 'Product', description: 'Product related end-points' },
      { name: 'Order',   description: 'Order related end-points'   },
      { name: 'Health',  description: 'Health check end-points'     },
    ],
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',            // ← now a literal 'apiKey'
        name: 'Authorization',
        in:   'header',
        description:
          'JWT Authorization header using the Bearer scheme. Example: "Bearer <token>"',
      },
    },
    security: [{ bearerAuth: [] }],
  },
};

// make sure exposeRoute / routePrefix are on swaggerUiOptions
export const swaggerUiOptions = {
  routePrefix: '/documentation',
  exposeRoute: true,
};
