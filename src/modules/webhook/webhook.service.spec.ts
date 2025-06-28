import { PrismaClient, WebhookSubscription } from '@prisma/client';
import { WebhookService, CreateWebhookDto } from './webhook.service';
import { AvailabilityQueue } from '../queues/availability.queue';

describe('WebhookService', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;
  let service: WebhookService;

  beforeEach(() => {
    mockPrisma = {
      webhookSubscription: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    } as any;

    service = new WebhookService(mockPrisma);
    // spy on the queue so we don't actually hit Redis
    jest.spyOn(AvailabilityQueue, 'add').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('creates a subscription with the given DTO', async () => {
      const dto: CreateWebhookDto = {
        endpoint: 'https://example.com/hook',
        sku: 'RED-S',
        minStock: 10,
      };
      const fakeSub: WebhookSubscription = {
        id: 'abc123',
        endpoint: dto.endpoint,
        sku: dto.sku,
        minStock: dto.minStock,
        createdAt: new Date(),
      };
      mockPrisma.webhookSubscription.create.mockResolvedValue(fakeSub);

      const result = await service.create(dto);

      expect(mockPrisma.webhookSubscription.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toBe(fakeSub);
    });
  });

  describe('findFor()', () => {
    it('finds subscriptions matching SKU and stock threshold', async () => {
      const sku = 'BLUE-M';
      const newStock = 5;
      const fakeSubs: WebhookSubscription[] = [
        { id: 'one', endpoint: 'e1', sku: null, minStock: 5, createdAt: new Date() },
        { id: 'two', endpoint: 'e2', sku: 'BLUE-M', minStock: 5, createdAt: new Date() },
      ];
      mockPrisma.webhookSubscription.findMany.mockResolvedValue(fakeSubs);

      const result = await service.findFor(sku, newStock);

      expect(mockPrisma.webhookSubscription.findMany).toHaveBeenCalledWith({
        where: {
          minStock: { gte: newStock },
          OR: [{ sku: null }, { sku }],
        },
      });
      expect(result).toBe(fakeSubs);
    });
  });

  describe('notifyAll()', () => {
    it('does nothing when there are no subscriptions', async () => {
      mockPrisma.webhookSubscription.findMany.mockResolvedValue([]);

      await service.notifyAll('SKU1', 3);

      expect(mockPrisma.webhookSubscription.findMany).toHaveBeenCalledWith({
        where: {
          minStock: { gte: 3 },
          OR: [{ sku: null }, { sku: 'SKU1' }],
        },
      });
      expect(AvailabilityQueue.add).not.toHaveBeenCalled();
    });

    it('enqueues a job for each matching subscription', async () => {
      const subs: WebhookSubscription[] = [
        { id: 'a', endpoint: 'http://a', sku: 'X', minStock: 7, createdAt: new Date() },
        { id: 'b', endpoint: 'http://b', sku: null, minStock: 7, createdAt: new Date() },
      ];
      mockPrisma.webhookSubscription.findMany.mockResolvedValue(subs);

      await service.notifyAll('X', 7);

      expect(AvailabilityQueue.add).toHaveBeenCalledTimes(2);
      expect(AvailabilityQueue.add).toHaveBeenCalledWith(
        'notify',
        { endpoint: 'http://a', sku: 'X', newStock: 7 },
        { attempts: 5, backoff: { type: 'exponential', delay: 1000 } }
      );
      expect(AvailabilityQueue.add).toHaveBeenCalledWith(
        'notify',
        { endpoint: 'http://b', sku: 'X', newStock: 7 },
        { attempts: 5, backoff: { type: 'exponential', delay: 1000 } }
      );
    });
  });
});
