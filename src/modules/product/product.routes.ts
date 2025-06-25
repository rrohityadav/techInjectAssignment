import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaClient } from '@prisma/client';

export default async function productRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & { prisma: PrismaClient }, // Ensure prisma is passed in options
) {
  const productService = new ProductService(options.prisma);
  const productController = new ProductController(productService);

  fastify.get(
    '/',
    {
      schema: {
        tags: ['Product'],
        summary: 'Get all products',
        response: {
          200: {
            description: 'Successful response',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string', nullable: true },
                price: { type: 'number' },
                inventory: { type: 'integer' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      // TODO: Implement proper request validation and typing if needed
      const products = await productController.getAllProducts();
      return reply.send(products);
    },
  );

  // TODO: Add more product routes (POST, GET by ID, PUT, DELETE)
}
