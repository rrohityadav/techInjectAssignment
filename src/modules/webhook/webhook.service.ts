import { PrismaClient, WebhookSubscription } from '@prisma/client';
import { AvailabilityQueue } from '../queues/availability.queue';

export interface CreateWebhookDto {
  endpoint: string;
  sku?: string;
  minStock: number;
}


export class WebhookService {
  constructor(private prisma: PrismaClient) {}

  async create(dto: CreateWebhookDto): Promise<WebhookSubscription> {
    return this.prisma.webhookSubscription.create({ data: dto });
  }

  async findFor(sku: string, newStock: number) {
    return this.prisma.webhookSubscription.findMany({
      where: {
        minStock: { gte: newStock },
        OR: [{ sku: null }, { sku }],
      },
    });
  }

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
