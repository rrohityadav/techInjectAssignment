import { PrismaClient, OrderStatus } from '@prisma/client';
import { CreateOrderDto, QueryOrdersDto, UpdateOrderStatusDto } from '@/modules/order/dto/order.dto';


export class OrderService {
  constructor(private readonly prisma: PrismaClient) {}

  async createOrder(dto: CreateOrderDto) {
    // 1) Load & validate each variation
    const detailPromises = dto.items.map(async (item) => {
      const v = await this.prisma.productVariation.findUnique({
        where: { sku: item.sku },
        select: {
          id: true,
          stock: true,
          price: true,
          productId: true,
        },
      });
      if (!v) throw new Error(`SKU not found: ${item.sku}`);
      if (v.stock < item.qty)
        throw new Error(`Insufficient stock for SKU ${item.sku}`);
      return {
        variationId: v.id,
        productId: v.productId,
        price: v.price,
        qty: item.qty,
      };
    });
    const details = await Promise.all(detailPromises);

    const totalAmount = details.reduce((sum, d) => sum + d.price * d.qty, 0);

    // 2) Atomically decrement stock & create order
    return this.prisma.$transaction(async (tx) => {
      // a) Decrement each variation’s stock
      for (const d of details) {
        await tx.productVariation.update({
          where: { id: d.variationId },
          data: { stock: { decrement: d.qty } },
        });
      }

      // b) Create the order + items
      return tx.order.create({
        data: {
          totalAmount,
          items: {
            create: details.map((d) => ({
              productId: d.productId,
              quantity: d.qty,
              price: d.price,
            })),
          },
        },
        include: { items: true },
      });
    });
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
