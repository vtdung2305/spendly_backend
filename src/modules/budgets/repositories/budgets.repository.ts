import { Injectable } from '@nestjs/common';
import { Budget } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BudgetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByMonth(userId: string, month: string) {
    return this.prisma.budget.findMany({
      where: { userId, month, deletedAt: null },
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  findByIdForUser(id: string, userId: string): Promise<Budget | null> {
    return this.prisma.budget.findFirst({ where: { id, userId, deletedAt: null } });
  }

  findByCategoryAndMonth(userId: string, categoryId: string, month: string): Promise<Budget | null> {
    return this.prisma.budget.findFirst({ where: { userId, categoryId, month, deletedAt: null } });
  }

  create(userId: string, categoryId: string, month: string, limitAmount: number): Promise<Budget> {
    return this.prisma.budget.create({ data: { userId, categoryId, month, limitAmount } });
  }

  update(id: string, limitAmount: number): Promise<Budget> {
    return this.prisma.budget.update({ where: { id }, data: { limitAmount } });
  }

  softDelete(id: string): Promise<Budget> {
    return this.prisma.budget.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async spentByCategoryForMonth(userId: string, month: string): Promise<Map<string, number>> {
    const [year, m] = month.split('-').map(Number);
    const from = new Date(year, m - 1, 1);
    const to = new Date(year, m, 1);
    const rows = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE', deletedAt: null, occurredAt: { gte: from, lt: to } },
      _sum: { amount: true },
    });
    return new Map(rows.map((r) => [r.categoryId, Number(r._sum.amount ?? 0)]));
  }
}
