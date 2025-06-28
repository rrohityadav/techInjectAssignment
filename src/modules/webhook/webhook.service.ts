import { PrismaClient, WebhookSubscription } from '@prisma/client';
import { AvailabilityQueue } from '../queues/availability.queue';

export interface CreateWebhookDto {
  endpoint: string;
  sku?: string;
  minStock: number;
}

export class WebhookService {
  constructor(private prisma: PrismaClient) {}

  // 1) Register a new subscription
  async create(dto: CreateWebhookDto): Promise<WebhookSubscription> {
    return this.prisma.webhookSubscription.create({ data: dto });
  }

  // 2) Find all subscriptions that want notified at this stock level
  async findFor(sku: string, newStock: number) {
    return this.prisma.webhookSubscription.findMany({
      where: {
        minStock: { gte: newStock },
        OR: [{ sku: null }, { sku }],
      },
    });
  }

  // 3) Enqueue notifications
  async notifyAll(sku: string, newStock: number) {
    const subs = await this.findFor(sku, newStock);
    for (const sub of subs) {
      await AvailabilityQueue.add(
        'notify',
        { endpoint: sub.endpoint, sku, newStock },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
        }
      );
    }
  }
}
