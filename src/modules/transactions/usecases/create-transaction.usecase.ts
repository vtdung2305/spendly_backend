import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { CheckBudgetAlertUseCase } from './check-budget-alert.usecase';

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    private readonly repo: TransactionsRepository,
    private readonly prisma: PrismaService,
    private readonly checkBudgetAlert: CheckBudgetAlertUseCase,
  ) {}

  async execute(userId: string, dto: CreateTransactionDto) {
    const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, userId, deletedAt: null } });
    if (!category) throw new NotFoundException('Category not found');

    const occurredAt = new Date(dto.occurredAt);
    const transaction = await this.repo.create(userId, {
      type: dto.type,
      categoryId: dto.categoryId,
      amount: dto.amount,
      note: dto.note,
      occurredAt,
    });

    if (dto.type === TransactionType.EXPENSE) {
      await this.checkBudgetAlert.execute({
        userId,
        categoryId: dto.categoryId,
        categoryName: category.name,
        occurredAt,
        transactionAmount: dto.amount,
      });
    }

    return transaction;
  }
}
