import {
  FastifyInstance,
  FastifyPluginOptions,
} from 'fastify';
import { PrismaClient } from '@prisma/client';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CreateOrderDto, QueryOrdersDto, UpdateOrderStatusDto } from '@/modules/order/dto/order.dto';

export default async function orderRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & { prisma: PrismaClient }
) {
  const service    = new OrderService(options.prisma);
  const controller = new OrderController(service);

  fastify.get<{ Querystring: QueryOrdersDto }>(
    '/',
    {
      preHandler: [fastify.authenticate, fastify.authorize('ADMIN')],
      schema: {
        tags: ['Order'],
        summary: 'List orders (admin only)',
        querystring: {
          type: 'object',
          properties: {
            cursor: { type: 'string' },
            search: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
        },
        response: {
          200: {
            description: 'Array of orders',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { type: 'string', enum: ['PLACED','PAID','DISPATCHED'] },
                totalAmount: { type: 'number' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      productId: { type: 'string' },
                      quantity: { type: 'integer' },
                      price: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    controller.getAllOrders.bind(controller)
  );

  fastify.post<{ Body: CreateOrderDto }>(
    '/',
    {
      preHandler: [fastify.authenticate, fastify.authorize('SELLER')],
      schema: {
        tags: ['Order'],
        summary: 'Create new order and reserve stock',
        body: {
          type: 'object',
          required: ['items'],
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['sku', 'qty'],
                properties: {
                  sku: { type: 'string' },
                  qty: { type: 'integer', minimum: 1 }
                }
              }
            }
          }
        },
        response: {
          201: {
            description: 'Order created successfully',
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string' },
              totalAmount: { type: 'number' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    quantity: { type: 'integer' },
                    price: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    },
    controller.createOrder.bind(controller)
  );

  fastify.patch<{
    Params: { id: string };
    Body: UpdateOrderStatusDto;
  }>(
    '/:id/status',
    {
      preHandler: [fastify.authenticate, fastify.authorize('ADMIN')],
      schema: {
        tags: ['Order'],
        summary: 'Update order status (admin only)',
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id']
        },
        body: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['PLACED', 'PAID', 'DISPATCHED']
            }
          }
        },
        response: {
          200: {
            description: 'Order updated',
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string' },
              totalAmount: { type: 'number' },
              updatedAt: { type: 'string' }
            }
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    controller.updateOrderStatus.bind(controller)
  );
}
