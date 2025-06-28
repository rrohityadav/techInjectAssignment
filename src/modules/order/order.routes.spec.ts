import Fastify, { FastifyInstance } from 'fastify';
import orderRoutes from './order.routes';
import { CreateOrderDto, QueryOrdersDto, UpdateOrderStatusDto } from '@/modules/order/dto/order.dto';

// --- 1) Stub OrderService before loading routes ---
const fakeOrderList = [
  {
    id: 'o1',
    status: 'PLACED',
    totalAmount: 100,
    createdAt: '2025-06-28T00:00:00.000Z',
    updatedAt: '2025-06-28T00:00:00.000Z',
    items: [
      { id: 'i1', productId: 'p1', quantity: 2, price: 50 },
    ],
  },
];

const fakeCreatedOrder = {
  id: 'o2',
  status: 'PLACED',
  totalAmount: 20,
  items: [
    { id: 'i2', quantity: 2, price: 10 },
  ],
};

const fakeUpdatedOrder = {
  id: 'o2',
  status: 'PAID',
  totalAmount: 20,
  updatedAt: '2025-06-28T01:00:00.000Z',
};

jest.mock('./order.service', () => {
  return {
    OrderService: jest.fn().mockImplementation(() => ({
      findAll: jest.fn().mockResolvedValue(fakeOrderList),
      createOrder: jest.fn().mockResolvedValue(fakeCreatedOrder),
      updateStatus: jest.fn().mockResolvedValue(fakeUpdatedOrder),
    })),
  };
});

describe('orderRoutes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();

    // stub auth/preHandlers
    app.decorate('authenticate', async (_req, _reply) => {});
    app.decorate('authorize', (_role: string) => async (_req, _reply) => {});

    // register routes under /v1/orders
    app.register(orderRoutes, { prefix: '/v1/orders', prisma: {} as any });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET  /v1/orders?search=foo&limit=5 → returns list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/orders?search=foo&limit=5',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(fakeOrderList);
  });

  it('POST /v1/orders → creates and returns order', async () => {
    const payload: CreateOrderDto = {
      items: [{ sku: 'SKU1', qty: 2 }],
    };
    const res = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      payload,
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual(fakeCreatedOrder);
  });

  it('PATCH /v1/orders/:id/status → updates and returns order', async () => {
    const payload: UpdateOrderStatusDto = { status: 'PAID' };
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/orders/o2/status',
      payload,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(fakeUpdatedOrder);
  });

  it('PATCH /v1/orders/:id/status with bad body → 400 error', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/orders/o2/status',
      payload: { foo: 'bar' },
    });
    expect(res.statusCode).toBe(400);
    // body validation error contains "body should have required property 'status'"
    expect(res.body).toContain('status');
  });
});
