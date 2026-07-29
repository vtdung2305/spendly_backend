import { OrderEntity } from '../entities/order.entity';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface IOrderRepository {
  findById(id: string): Promise<OrderEntity | null>;
  findByIdForUser(id: string, userId: string): Promise<OrderEntity | null>;
  findMany(params: {
    userId?: string;
    status?: string;
    cursor?: string;
    limit: number;
    sort: string;
  }): Promise<{ data: OrderEntity[]; cursor: string | null; hasMore: boolean }>;
  createWithItems(order: OrderEntity): Promise<OrderEntity>;
  updateStatus(id: string, status: string, version: number): Promise<OrderEntity>;
  softDelete(id: string): Promise<void>;
}
