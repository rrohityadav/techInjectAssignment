import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { WebhookService, CreateWebhookDto } from './webhook.service';

export default async function webhookRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & { prisma: PrismaClient }
) {
  const service = new WebhookService(options.prisma);

  fastify.post('/webhooks', {
    schema: {
      tags: ['Webhook'],
      summary: 'Register for stock notifications',
      body: {
        type: 'object',
        required: ['endpoint', 'minStock'],
        properties: {
          endpoint: { type: 'string', format: 'uri' },
          sku: { type: 'string' },
          minStock: { type: 'integer' }
        }
      },
      response: {
        201: {
          description: 'Subscription created',
          type: 'object',
          properties: {
            id: { type: 'string' },
            endpoint: { type: 'string' },
            sku: { type: 'string' },
            minStock: { type: 'integer' },
            createdAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: CreateWebhookDto }>, reply) => {
    const dto = request.body;
    const sub = await service.create(dto);
    reply.code(201).send(sub);
  });
}
