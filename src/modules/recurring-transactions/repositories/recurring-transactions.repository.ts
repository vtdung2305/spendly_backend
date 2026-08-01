import { Injectable } from '@nestjs/common';
import { Prisma, RecurringTransaction } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RecurringTransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string) {
    return this.prisma.recurringTransaction.findMany({
      where: { userId, deletedAt: null },
      include: { category: true },
      orderBy: [{ isActive: 'desc' }, { dayOfMonth: 'asc' }],
    });
  }

  findByIdForUser(id: string, userId: string): Promise<RecurringTransaction | null> {
    return this.prisma.recurringTransaction.findFirst({ where: { id, userId, deletedAt: null } });
  }

  create(
    userId: string,
    data: Omit<Prisma.RecurringTransactionUncheckedCreateInput, 'userId'>,
  ): Promise<RecurringTransaction> {
    return this.prisma.recurringTransaction.create({ data: { ...data, userId } });
  }

  update(id: string, data: Prisma.RecurringTransactionUpdateInput): Promise<RecurringTransaction> {
    return this.prisma.recurringTransaction.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<RecurringTransaction> {
    return this.prisma.recurringTransaction.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** Active recurring transactions due today that haven't been generated for this month yet. */
  findDueForGeneration(dayOfMonth: number, monthKey: string): Promise<RecurringTransaction[]> {
    return this.prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        dayOfMonth,
        OR: [{ lastGeneratedMonth: null }, { lastGeneratedMonth: { not: monthKey } }],
      },
    });
  }

  markGenerated(id: string, monthKey: string): Promise<RecurringTransaction> {
    return this.prisma.recurringTransaction.update({ where: { id }, data: { lastGeneratedMonth: monthKey } });
  }
}
