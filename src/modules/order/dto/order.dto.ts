import type { OrderStatus } from '@prisma/client';

export interface OrderItemDto {
  sku: string;
  qty: number;
}

export interface CreateOrderDto {
  items: OrderItemDto[];
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

export interface QueryOrdersDto {
  cursor?: string;
  search?: string;
  limit?: number;
}
