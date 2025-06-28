import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from './order.service';
import { CreateOrderDto, QueryOrdersDto, UpdateOrderStatusDto } from '@/modules/order/dto/order.dto';

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  async getAllOrders(
    request: FastifyRequest<{ Querystring: QueryOrdersDto }>,
    reply: FastifyReply
  ) {
    const orders = await this.orderService.findAll(request.query);
    return reply.send(orders);
  }

  async createOrder(
    request: FastifyRequest<{ Body: CreateOrderDto }>,
    reply: FastifyReply
  ) {
    const order = await this.orderService.createOrder(request.body);
    return reply.code(201).send(order);
  }

  async updateOrderStatus(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateOrderStatusDto;
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const updated = await this.orderService.updateStatus(id, request.body);
    return reply.send(updated);
  }
}
