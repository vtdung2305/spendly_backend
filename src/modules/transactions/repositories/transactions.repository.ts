import { Injectable } from '@nestjs/common';
import { Prisma, Transaction, TransactionType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { decodeCursor, encodeCursor } from '../../../common/pagination/cursor.util';

export interface ListTransactionsParams {
  userId: string;
  type?: TransactionType;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  cursor?: string;
  limit: number;
}

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByIdForUser(id: string, userId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });
  }

  create(userId: string, data: Omit<Prisma.TransactionUncheckedCreateInput, 'userId'>): Promise<Transaction> {
    return this.prisma.transaction.create({ data: { ...data, userId } });
  }

  update(id: string, data: Prisma.TransactionUpdateInput): Promise<Transaction> {
    return this.prisma.transaction.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Transaction> {
    return this.prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async findMany(params: ListTransactionsParams) {
    const where: Prisma.TransactionWhereInput = {
      userId: params.userId,
      deletedAt: null,
      ...(params.type ? { type: params.type } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.dateFrom || params.dateTo
        ? {
            occurredAt: {
              ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
              ...(params.dateTo ? { lte: new Date(params.dateTo) } : {}),
            },
          }
        : {}),
      ...(params.amountMin !== undefined || params.amountMax !== undefined
        ? {
            amount: {
              ...(params.amountMin !== undefined ? { gte: params.amountMin } : {}),
              ...(params.amountMax !== undefined ? { lte: params.amountMax } : {}),
            },
          }
        : {}),
      ...(params.search ? { note: { contains: params.search, mode: 'insensitive' } } : {}),
    };

    if (params.cursor) {
      const { id, v } = decodeCursor(params.cursor);
      where.OR = [
        { occurredAt: { lt: new Date(v) } },
        { occurredAt: new Date(v), id: { lt: id } },
      ];
    }

    const rows = await this.prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: params.limit + 1,
    });

    const hasMore = rows.length > params.limit;
    const data = hasMore ? rows.slice(0, params.limit) : rows;
    const last = data[data.length - 1];
    const cursor = hasMore && last ? encodeCursor({ id: last.id, sortValue: last.occurredAt }) : null;

    return { data, cursor, hasMore };
  }

  async recentForUser(userId: string, limit: number) {
    return this.prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      include: { category: true },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  async sumByTypeInRange(userId: string, type: TransactionType, from: Date, to: Date): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: { userId, type, deletedAt: null, occurredAt: { gte: from, lt: to } },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  async dailyTotalsInRange(userId: string, type: TransactionType, from: Date, to: Date) {
    return this.prisma.transaction.groupBy({
      by: ['occurredAt'],
      where: { userId, type, deletedAt: null, occurredAt: { gte: from, lt: to } },
      _sum: { amount: true },
    });
  }

  async categoryBreakdownInRange(userId: string, type: TransactionType, from: Date, to: Date) {
    return this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type, deletedAt: null, occurredAt: { gte: from, lt: to } },
      _sum: { amount: true },
    });
  }
}
