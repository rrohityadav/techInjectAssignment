// src/modules/product/product.routes.spec.ts
import Fastify, { FastifyInstance } from 'fastify';
import productRoutes from './product.routes';

// --- 1) Fake data returned by our mocked service ---
const fakeProduct = {
  id: 'p1',
  name: 'Prod1',
  description: null,
  category: null,
  createdAt: '2025-06-28T00:00:00.000Z',
  updatedAt: '2025-06-28T00:00:00.000Z',
  variations: [],
};

const fakePagination = {
  data: [fakeProduct],
  meta: { page: 1, perPage: 10, total: 1 },
};

const fakeVarAttr = {
  id: 'va1',
  name: 'Color',
  value: 'Red',
  variationId: 'v1',
};

const fakeRaw = {
  id: 'r1',
  name: 'Steel',
  description: null,
  unit: 'kg',
  quantity: 100,
  supplier: null,
  createdAt: '2025-06-28T00:00:00.000Z',
  updatedAt: '2025-06-28T00:00:00.000Z',
};

const fakeBom = {
  id: 'b1',
  variationId: 'v1',
  rawMaterialId: 'r1',
  quantityRequired: 2,
  createdAt: '2025-06-28T00:00:00.000Z',
  updatedAt: '2025-06-28T00:00:00.000Z',
};

// --- 2) Mock ProductService before importing routes ---
jest.mock('./product.service', () => {
  return {
    ProductService: jest.fn().mockImplementation(() => ({
      createProduct: jest.fn().mockResolvedValue(fakeProduct),
      findAll: jest.fn().mockResolvedValue(fakePagination),
      findOne: jest.fn().mockResolvedValue(fakeProduct),
      updateProduct: jest.fn().mockResolvedValue(fakeProduct),
      remove: jest.fn().mockResolvedValue(true),
      findByIdOrSku: jest.fn().mockResolvedValue(fakeProduct),
      updateByIdOrSku: jest.fn().mockResolvedValue(true),
      createVariationAttribute: jest.fn().mockResolvedValue(fakeVarAttr),
      updateVariationAttribute: jest.fn().mockResolvedValue(fakeVarAttr),
      deleteVariationAttribute: jest.fn().mockResolvedValue(true),
      createRawMaterial: jest.fn().mockResolvedValue(fakeRaw),
      rawMaterialList: jest.fn().mockResolvedValue([fakeRaw]),
      rawMaterial: jest.fn().mockResolvedValue(fakeRaw),
      updateRawMaterial: jest.fn().mockResolvedValue(fakeRaw),
      createBom: jest.fn().mockResolvedValue(fakeBom),
      bomList: jest.fn().mockResolvedValue([fakeBom]),
      updateBom: jest.fn().mockResolvedValue(fakeBom),
    })),
  };
});

describe('productRoutes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();

    // Stub auth hooks so preHandlers pass
    app.decorate('authenticate', async (_req, _reply) => {});
    app.decorate('authorize', (role: string) => async (_req, _reply) => {});

    // Register our routes under /v1/products
    app.register(productRoutes, { prefix: '/v1/products', prisma: {} as any });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET  /v1/products → pagination response', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/products?perPage=1&limit=10',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(fakePagination);
  });

  it('POST /v1/products → creates product', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/products',
      payload: { name: 'Prod1' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual(fakeProduct);
  });

  it('GET  /v1/products/:id → fetches product', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/products/p1',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      id: 'p1',
      name: 'Prod1',
      description: '',
      category: '',
      variations: [],
    });
  });
  it('PUT  /v1/products/:id → updates product', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/products/p1',
      payload: { name: 'NewName' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      name: 'Prod1',
      description: '',
      category: '',
    });
  });




  it('DELETE /v1/products/:id → deletes product', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/products/p1',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true });
  });

  it('GET  /v1/products/byIdOrSku/:sku → fetches by SKU', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/products/byIdOrSku/SKU1',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(fakeProduct);
  });

  it('PUT  /v1/products/v1/updateByIdOrSku/:id → updates by ID or SKU', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/products/v1/updateByIdOrSku/SKU1',
      payload: { price: 99 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true, message: 'Updated successfully' });
  });

  // variation-attributes
  it('POST /v1/products/variation-attributes → creates attribute', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/products/variation-attributes',
      payload: { name: 'Color', value: 'Red', variationId: 'v1' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual(fakeVarAttr);
  });

  it('PUT  /v1/products/update/variation-attributes/:id → updates attribute', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/products/update/variation-attributes/va1',
      payload: { value: 'Blue' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(fakeVarAttr);
  });

  it('DELETE /v1/products/delete/variation-attributes/:id → deletes attribute', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/products/delete/variation-attributes/va1',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true });
  });


  // raw-material
  it('POST   /v1/products/create/raw-material → creates raw material', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/products/create/raw-material',
      payload: { name: 'Steel', unit: 'kg' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual(fakeRaw);
  });

  it('GET    /v1/products/raw-material/list → lists raw materials', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/products/raw-material/list',
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual([fakeRaw]);
  });

  it('GET    /v1/products/raw-material/single/:id → fetches single raw material', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/products/raw-material/single/r1',
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual(fakeRaw);
  });

  it('PUT    /v1/products/raw-material/update/:id → updates raw material', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/products/raw-material/update/r1',
      payload: { name: 'Iron', unit: 'kg' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(fakeRaw);
  });

  // BOM
  it('POST   /v1/products/bom/create → creates BOM', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/products/bom/create',
      payload: { variationId: 'v1', rawMaterialId: 'r1', quantityRequired: 2 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(fakeBom);
  });

  it('GET    /v1/products/bom/list → lists BOMs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/products/bom/list',
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual([fakeBom]);
  });

  it('PUT    /v1/products/bom/update/:id → updates BOM', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/v1/products/bom/update/b1',
      payload: { quantityRequired: 5 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(fakeBom);
  });
});
