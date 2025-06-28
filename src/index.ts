
// console.log('DATABASE_URL from process.env:', process.env.DATABASE_URL);
// console.log('Attempting to load .env file from:', process.cwd());

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import sensible from '@fastify/sensible';
import { PrismaClient } from '@prisma/client';
import productRoutes from './modules/product/product.routes';
import orderRoutes from './modules/order/order.routes';
import { swaggerOptions, swaggerUiOptions } from './config/swagger';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import http from 'http';
import './modules/inventory/cron.service';
import './modules/inventory/inventory.service';
import './modules/queues/availability.worker';       // start the worker
import webhookRoutes from './modules/webhook/webhook.routes';
import jwt from '@fastify/jwt';
import authRoutes from './modules/auth/auth.routes';
import './modules/auth/auth-plugins';
const prisma = new PrismaClient();

async function main() {
  const server: FastifyInstance = Fastify({
    serverFactory: (handler) => {
      const server = http.createServer((req, res) => {
        handler(req, res);
      });
      return server;
    },
    // logger: {
    //   level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    //   transport: {
    //     target: 'pino-pretty',
    //     options: { colorize: true },
    //   },
    // },
  });


  try {
    await prisma.$connect();
    server.log.info('Connected to database');

    await server.register(sensible);
    await server.register(swagger, swaggerOptions);
    await server.register(swaggerUi, swaggerUiOptions);

    server.get('/healthz', async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({ status: 'ok' });
    });
    const JWT_SECRET = process.env.JWT_SECRET ?? 'supersecret';
    await server.register(jwt, {
      secret: JWT_SECRET,
      sign: { expiresIn: '30m' },
    });
    server.decorate(
      'authenticate',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.send(err);
        }
      }
    );


    type RoleStr = 'ADMIN' | 'SELLER';

    server.decorate(
      'authorize',
      (requiredRole: RoleStr) =>
        // this inner function *is* the preHandler
        async (request: FastifyRequest, reply: FastifyReply) => {
          // request.user was populated by `authenticate()`
          const user = request.user as { role: RoleStr };

          // ADMIN always allowed; others must match exactly
          if (user.role !== requiredRole && user.role !== 'ADMIN') {
            return reply.code(403).send({ message: 'Forbidden' });
          }
        }
    );
    await server.register(productRoutes, { prefix: '/v1/products', prisma });
    await server.register(orderRoutes, { prefix: '/v1/orders', prisma });
    await server.register(webhookRoutes, { prefix: '/v1', prisma });
    await server.register(authRoutes, { prefix: '/v1/auth', prisma });

    const port = parseInt(process.env.PORT || '3000', 10);
    await server.listen({ port, host: '0.0.0.0' });

    console.log(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

void main();
