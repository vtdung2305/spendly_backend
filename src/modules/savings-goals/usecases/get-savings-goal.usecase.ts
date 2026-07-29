import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { TransactionsQueryService } from '../../transactions/services/transactions-query.service';

@Injectable()
export class GetSavingsGoalUseCase {
  constructor(
    private readonly repo: SavingsGoalsRepository,
    private readonly transactionsQuery: TransactionsQueryService,
  ) {}

  async execute(userId: string, year: number) {
    const goal = await this.repo.findByYear(userId, year);

    const from = new Date(year, 0, 1);
    const now = new Date();
    const to = now.getFullYear() === year ? new Date(now.getFullYear(), now.getMonth() + 1, 1) : new Date(year + 1, 0, 1);

    const [income, expense] = await Promise.all([
      this.transactionsQuery.sumByTypeInRange(userId, TransactionType.INCOME, from, to),
      this.transactionsQuery.sumByTypeInRange(userId, TransactionType.EXPENSE, from, to),
    ]);
    const current = Math.max(0, income - expense);
    const targetAmount = goal ? Number(goal.targetAmount) : 0;

    return {
      year,
      targetAmount,
      currentAmount: current,
      percent: targetAmount > 0 ? Math.round((current / targetAmount) * 1000) / 10 : 0,
    };
  }
}
