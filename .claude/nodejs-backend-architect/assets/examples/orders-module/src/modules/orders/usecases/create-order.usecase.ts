import { Injectable, Inject, UnprocessableEntityException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ORDER_REPOSITORY } from '../repositories/orders.repository.interface';
import type { IOrderRepository } from '../repositories/orders.repository.interface';
import { OrderEntity, OrderItemEntity, OrderStatus } from '../entities/order.entity';

/**
 * UseCase responsibilities:
 * - Validate business rules (stock, limits, state)
 * - Orchestrate repository calls
 * - Emit domain events
 * - Return domain entity
 *
 * No HTTP concepts. No Prisma imports. No framework decorators except @Injectable.
 */

export interface CreateOrderInput {
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  note?: string;
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    // In a real app, this would be IProductRepository from the Products module's exported service
    @Inject('PRODUCT_SERVICE') private readonly productService: { findByIds(ids: string[]): Promise<any[]> },
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: CreateOrderInput): Promise<OrderEntity> {
    // 1. Fetch products and validate existence
    const productIds = input.items.map(i => i.productId);
    const products = await this.productService.findByIds(productIds);

    const missingIds = productIds.filter(id => !products.find(p => p.id === id));
    if (missingIds.length > 0) {
      throw new NotFoundException(`Products not found: ${missingIds.join(', ')}`);
    }

    // 2. Validate stock
    for (const item of input.items) {
      const product = products.find(p => p.id === item.productId);
      if (product.stock < item.quantity) {
        throw new UnprocessableEntityException(
          `Insufficient stock for ${product.name}: requested ${item.quantity}, available ${product.stock}`,
        );
      }
    }

    // 3. Build domain entity
    const orderItems = input.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return OrderItemEntity.create({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    });

    const order = new OrderEntity();
    order.userId = input.userId;
    order.status = OrderStatus.PENDING;
    order.items = orderItems;
    order.note = input.note;
    order.calculateTotal();

    // 4. Persist (transaction: create order + items + reserve stock)
    const saved = await this.orderRepo.createWithItems(order);

    // 5. Emit domain event (async side effects: email, analytics, etc.)
    this.eventEmitter.emit('order.created', {
      orderId: saved.id,
      userId: saved.userId,
      totalAmount: saved.totalAmount,
      itemCount: saved.items.length,
    });

    return saved;
  }
}
