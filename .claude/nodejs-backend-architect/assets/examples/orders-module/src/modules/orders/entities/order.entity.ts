/**
 * Domain entity — framework-free, contains business logic.
 * No decorators, no NestJS imports, no Prisma imports.
 */

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class OrderItemEntity {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; // in smallest currency unit (cents)
  totalPrice: number;

  static create(params: {
    id?: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }): OrderItemEntity {
    const item = new OrderItemEntity();
    Object.assign(item, params);
    item.totalPrice = params.quantity * params.unitPrice;
    return item;
  }
}

export class OrderEntity {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItemEntity[];
  totalAmount: number; // in cents
  note?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;

  /**
   * Business rule: calculate total from items.
   */
  calculateTotal(): number {
    this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    return this.totalAmount;
  }

  /**
   * Business rule: only PENDING and CONFIRMED orders can be cancelled.
   */
  canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(this.status);
  }

  /**
   * Business rule: only DELIVERED orders can be refunded, within 30 days.
   */
  canBeRefunded(): boolean {
    if (this.status !== OrderStatus.DELIVERED) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.updatedAt > thirtyDaysAgo;
  }

  /**
   * Valid state transitions.
   */
  private static readonly TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.PENDING],
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: [],
  };

  canTransitionTo(newStatus: OrderStatus): boolean {
    return OrderEntity.TRANSITIONS[this.status]?.includes(newStatus) ?? false;
  }

  /**
   * Map from Prisma record to domain entity.
   * This is the ONLY place Prisma shape knowledge exists.
   */
  static fromPrisma(record: any): OrderEntity {
    const entity = new OrderEntity();
    entity.id = record.id;
    entity.userId = record.userId;
    entity.status = record.status as OrderStatus;
    entity.totalAmount = record.totalAmount;
    entity.note = record.note;
    entity.version = record.version;
    entity.createdAt = record.createdAt;
    entity.updatedAt = record.updatedAt;
    entity.deletedAt = record.deletedAt;
    entity.createdBy = record.createdBy;
    entity.updatedBy = record.updatedBy;
    entity.items = (record.items || []).map((item: any) =>
      OrderItemEntity.create({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }),
    );
    return entity;
  }
}
