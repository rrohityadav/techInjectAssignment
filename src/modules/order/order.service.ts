import { PrismaClient, OrderStatus } from '@prisma/client';
import { CreateOrderDto, QueryOrdersDto, UpdateOrderStatusDto } from '@/modules/order/dto/order.dto';
import { WebhookService } from '../webhook/webhook.service';

interface Detail {
  variationId: string;
  sku: string;
  originalStock: number;
  price: number;
  qty: number;
  productId:string;
}
export class OrderService {
  private webhookService: WebhookService;

  constructor(private readonly prisma: PrismaClient) {
    this.webhookService = new WebhookService(prisma);
  }

  async createOrder(dto: CreateOrderDto) {
    // 1) Load & validate each variation
    const detailPromises = dto.items.map(async (item) => {
      const v = await this.prisma.productVariation.findUnique({
        where: { sku: item.sku },
        select: {
          id:         true,
          sku:        true,
          stock:      true,
          price:      true,
          productId:  true,
        },
      });
      if (!v) throw new Error(`SKU not found: ${item.sku}`);
      if (v.stock < item.qty)
        throw new Error(`Insufficient stock for SKU ${item.sku}`);

      return {
        variationId:   v.id,
        sku:           v.sku,
        originalStock: v.stock,
        price:         v.price,
        qty:           item.qty,
        productId:     v.productId,
      } as Detail;
    });
    const details = await Promise.all(detailPromises);

    // 2) Compute total order amount
    const totalAmount = details.reduce((sum, d) => sum + d.price * d.qty, 0);

    // 3) Atomically decrement stock & create order
    const order = await this.prisma.$transaction(async (tx) => {
      // a) Decrement each variation’s stock
      for (const d of details) {
        await tx.productVariation.update({
          where: { id: d.variationId },
          data: { stock: { decrement: d.qty } },
        });
      }

      // b) Create the Order + its OrderItems
      return tx.order.create({
        data: {
          totalAmount,
          items: {
            create: details.map((d) => ({
              productId: d.productId,
              quantity:  d.qty,
              price:     d.price,
            })),
          },
        },
        include: { items: true },
      });
    });

    for (const d of details) {
      const newStock = d.originalStock - d.qty;
      await this.webhookService.notifyAll(d.sku, newStock);
    }

    return order;
  }
  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const o = await this.prisma.order.findUnique({ where: { id } });
    if (!o) throw new Error('Order not found');

    const allowed: Record<OrderStatus, OrderStatus[]> = {
      PLACED: ['PAID'],
      PAID: ['DISPATCHED'],
      DISPATCHED: [],
    };
    if (!allowed[o.status].includes(dto.status))
      throw new Error(`Cannot transition ${o.status} → ${dto.status}`);

    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async findAll(query: QueryOrdersDto) {
    const { cursor, search, limit = 10 } = query;
    const where: any = {};

    if (search) {
      where.OR = [
        { id: { contains: search } },
        {
          items: {
            some: {
              product: { name: { contains: search } },
            },
          },
        },
      ];
    }

    const args: any = {
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    };
    if (cursor) {
      args.cursor = { id: cursor };
      args.skip = 1;
    }

    return this.prisma.order.findMany(args);
  }
}
