import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RecurringTransactionsRepository } from '../repositories/recurring-transactions.repository';
import { UpdateRecurringTransactionDto } from '../dto/update-recurring-transaction.dto';

@Injectable()
export class UpdateRecurringTransactionUseCase {
  constructor(
    private readonly repo: RecurringTransactionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, userId: string, dto: UpdateRecurringTransactionDto) {
    const recurring = await this.repo.findByIdForUser(id, userId);
    if (!recurring) throw new NotFoundException('Recurring transaction not found');

    if (dto.categoryId) {
      const type = dto.type ?? recurring.type;
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, userId, type, deletedAt: null },
      });
      if (!category) throw new NotFoundException('Category not found for the given type');
    }

    return this.repo.update(id, {
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.categoryId ? { category: { connect: { id: dto.categoryId } } } : {}),
      ...(dto.label !== undefined ? { label: dto.label } : {}),
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.dayOfMonth !== undefined ? { dayOfMonth: dto.dayOfMonth } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
  }
}
