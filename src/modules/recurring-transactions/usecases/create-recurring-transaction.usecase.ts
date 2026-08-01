import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RecurringTransactionsRepository } from '../repositories/recurring-transactions.repository';
import { CreateRecurringTransactionDto } from '../dto/create-recurring-transaction.dto';

@Injectable()
export class CreateRecurringTransactionUseCase {
  constructor(
    private readonly repo: RecurringTransactionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, dto: CreateRecurringTransactionDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId, type: dto.type, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Category not found for the given type');

    return this.repo.create(userId, {
      type: dto.type,
      categoryId: dto.categoryId,
      label: dto.label,
      amount: dto.amount,
      dayOfMonth: dto.dayOfMonth,
      isActive: dto.isActive ?? true,
    });
  }
}
