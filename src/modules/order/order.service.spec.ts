import { PrismaClient, OrderStatus } from '@prisma/client';
import { OrderService } from './order.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  QueryOrdersDto,
} from '@/modules/order/dto/order.dto';

describe('OrderService', () => {
  let mockPrisma: any;
  let service: OrderService;

  beforeEach(() => {
    mockPrisma = {
      productVariation: {
        findUnique: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new OrderService(mockPrisma as PrismaClient);
    // replace the real WebhookService with a spy
    service['webhookService'].notifyAll = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const dto: CreateOrderDto = {
      items: [{ sku: 'SKU1', qty: 2 }],
    };

    it('successfully creates an order and notifies webhooks', async () => {
      // 1) Mock findUnique → valid variation
      mockPrisma.productVariation.findUnique.mockResolvedValue({
        id: 'var1',
        sku: 'SKU1',
        stock: 5,
        price: 10,
        productId: 'prod1',
      });

      // 2) Prepare a fake transaction
      const mockTx = {
        productVariation: { update: jest.fn() },
        order: { create: jest.fn() },
      };
      // have $transaction call our callback with mockTx
      mockPrisma.$transaction.mockImplementation((cb: (arg0: { productVariation: { update: jest.Mock<any, any, any>; }; order: { create: jest.Mock<any, any, any>; }; }) => any) => cb(mockTx));

      // 3) Mock the creation result
      const fakeOrder = {
        id: 'order1',
        totalAmount: 20,
        items: [
          { id: 'item1', productId: 'prod1', quantity: 2, price: 10 },
        ],
      };
      mockTx.order.create.mockResolvedValue(fakeOrder);

      // 4) Call createOrder
      const result = await service.createOrder(dto);

      // 5) Verify the stock was decremented
      expect(mockTx.productVariation.update).toHaveBeenCalledWith({
        where: { id: 'var1' },
        data: { stock: { decrement: 2 } },
      });

      // 6) Verify the order.create call
      expect(mockTx.order.create).toHaveBeenCalledWith({
        data: {
          totalAmount: 20,
          items: {
            create: [
              { productId: 'prod1', quantity: 2, price: 10 },
            ],
          },
        },
        include: { items: true },
      });

      // 7) Verify webhook notifications
      expect(service['webhookService'].notifyAll).toHaveBeenCalledWith(
        'SKU1',
        3 // 5 original - 2 qty
      );

      // 8) And finally the returned order
      expect(result).toBe(fakeOrder);
    });

    it('throws if SKU not found', async () => {
      mockPrisma.productVariation.findUnique.mockResolvedValue(null);
      await expect(service.createOrder(dto)).rejects.toThrow(
        'SKU not found: SKU1'
      );
    });

    it('throws if insufficient stock', async () => {
      mockPrisma.productVariation.findUnique.mockResolvedValue({
        id: 'var1',
        sku: 'SKU1',
        stock: 1,
        price: 10,
        productId: 'prod1',
      });
      await expect(service.createOrder(dto)).rejects.toThrow(
        'Insufficient stock for SKU SKU1'
      );
    });
  });

  describe('updateStatus', () => {
    const dto: UpdateOrderStatusDto = { status: OrderStatus.PAID };

    it('throws if order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus('orderX', dto)).rejects.toThrow(
        'Order not found'
      );
    });

    it('throws if transition not allowed', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order1',
        status: OrderStatus.PLACED,
      });
      const badDto: UpdateOrderStatusDto = { status: OrderStatus.DISPATCHED };
      await expect(service.updateStatus('order1', badDto)).rejects.toThrow(
        'Cannot transition PLACED → DISPATCHED'
      );
    });

    it('updates status when valid', async () => {
      const existing = { id: 'order1', status: OrderStatus.PLACED };
      const updated = {
        id: 'order1',
        status: OrderStatus.PAID,
      };
      mockPrisma.order.findUnique.mockResolvedValue(existing);
      mockPrisma.order.update.mockResolvedValue(updated);

      const result = await service.updateStatus('order1', dto);
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order1' },
        data: { status: OrderStatus.PAID },
      });
      expect(result).toBe(updated);
    });
  });

  describe('findAll', () => {
    const sampleOrders = [
      {
        id: 'order1',
        status: OrderStatus.PLACED,
        totalAmount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [{ id: 'item1', product: { name: 'A' } }],
      },
    ];

    it('fetches without search or cursor', async () => {
      mockPrisma.order.findMany.mockResolvedValue(sampleOrders as any);
      const res = await service.findAll({} as QueryOrdersDto);
      expect(res).toBe(sampleOrders);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: {},
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } },
      });
    });

    it('applies search and cursor', async () => {
      mockPrisma.order.findMany.mockResolvedValue(sampleOrders as any);
      await service.findAll({ search: 'foo', cursor: 'c1', limit: 5 });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { id: { contains: 'foo' } },
            { items: { some: { product: { name: { contains: 'foo' } } } } },
          ],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } },
        cursor: { id: 'c1' },
        skip: 1,
      });
    });
  });
});
