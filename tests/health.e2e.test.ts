import Fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import supertest from 'supertest';
import { PrismaClient } from '@prisma/client';
import productRoutes from '../src/modules/product/product.routes'; // Adjusted path
import orderRoutes from '../src/modules/order/order.routes'; // Adjusted path
import sensible from '@fastify/sensible';

let server: FastifyInstance;
let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();

  server = Fastify();
  await server.register(sensible);
  // Register routes with prisma instance
  await server.register(productRoutes, { prefix: '/v1/products', prisma });
  await server.register(orderRoutes, { prefix: '/v1/orders', prisma });

  // Add health check directly for testing, or import from main app setup if preferred
  server.get(
    '/healthz',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({ status: 'ok' });
    },
  );

  await server.ready(); // Ensure all plugins are loaded
});

afterAll(async () => {
  await server.close();
  await prisma.$disconnect();
});

describe('Health Check E2E', () => {
  it('GET /healthz should return { status: "ok" }', async () => {
    const response = await supertest(server.server)
      .get('/healthz')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('Product Endpoint E2E', () => {
  it('GET /v1/products should return an empty array', async () => {
    const response = await supertest(server.server)
      .get('/v1/products')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual([]);
  });
});
