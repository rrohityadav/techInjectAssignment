import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { CreateOrderDto, QueryOrdersDto, UpdateOrderStatusDto } from '@/modules/order/dto/order.dto';
import { FastifyRequest, FastifyReply } from 'fastify';

describe('OrderController', () => {
  let mockService: jest.Mocked<OrderService>;
  let controller: OrderController;
  let reply: Partial<FastifyReply>;

  beforeEach(() => {
    mockService = {
      findAll: jest.fn(),
      createOrder: jest.fn(),
      updateStatus: jest.fn(),
    } as any;

    controller = new OrderController(mockService);
    reply = {
      send: jest.fn(),
      code: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllOrders', () => {
    it('should call service.findAll with request.query and send the result', async () => {
      const fakeOrders = [{ id: 'o1' }];
      // @ts-ignore
      mockService.findAll.mockResolvedValue(fakeOrders);

      const req = { query: { search: 'foo', limit: 5 } } as FastifyRequest<{ Querystring: QueryOrdersDto }>;

      await controller.getAllOrders(req, reply as FastifyReply);

      expect(mockService.findAll).toHaveBeenCalledWith(req.query);
      expect(reply.send).toHaveBeenCalledWith(fakeOrders);
    });
  });

  describe('createOrder', () => {
    it('should call service.createOrder and send a 201 response with the created order', async () => {
      const dto: CreateOrderDto = { items: [{ sku: 'SKU1', qty: 3 }] };
      const fakeOrder = { id: 'o2', totalAmount: 30 };
      // @ts-ignore
      mockService.createOrder.mockResolvedValue(fakeOrder);

      const req = { body: dto } as FastifyRequest<{ Body: CreateOrderDto }>;
      await controller.createOrder(req, reply as FastifyReply);

      expect(mockService.createOrder).toHaveBeenCalledWith(dto);
      expect(reply.code).toHaveBeenCalledWith(201);
      expect(reply.send).toHaveBeenCalledWith(fakeOrder);
    });
  });

  describe('updateOrderStatus', () => {
    it('should call service.updateStatus and send the updated order', async () => {
      const id = 'order123';
      const dto: UpdateOrderStatusDto = { status: 'PAID' };
      const fakeUpdated = { id, status: 'PAID' };
      // @ts-ignore
      mockService.updateStatus.mockResolvedValue(fakeUpdated);

      const req = {
        params: { id },
        body: dto,
      } as FastifyRequest<{ Params: { id: string }; Body: UpdateOrderStatusDto }>;

      await controller.updateOrderStatus(req, reply as FastifyReply);

      expect(mockService.updateStatus).toHaveBeenCalledWith(id, dto);
      expect(reply.send).toHaveBeenCalledWith(fakeUpdated);
    });
  });
});
