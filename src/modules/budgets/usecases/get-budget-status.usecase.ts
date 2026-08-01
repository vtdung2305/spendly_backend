import { Injectable } from '@nestjs/common';
import { BudgetsRepository } from '../repositories/budgets.repository';

export interface BudgetStatus {
  limitAmount: number;
  spentAmount: number;
  usedPercent: number;
}

/** Used by the Transactions module to check whether an expense just crossed the alert threshold. */
@Injectable()
export class GetBudgetStatusUseCase {
  constructor(private readonly repo: BudgetsRepository) {}

  async execute(userId: string, categoryId: string, month: string): Promise<BudgetStatus | null> {
    const budget = await this.repo.findByCategoryAndMonth(userId, categoryId, month);
    if (!budget) return null;

    const limitAmount = Number(budget.limitAmount);
    const spentAmount = await this.repo.spentForCategoryMonth(userId, categoryId, month);

    return {
      limitAmount,
      spentAmount,
      usedPercent: limitAmount > 0 ? Math.round((spentAmount / limitAmount) * 1000) / 10 : 0,
    };
  }
}
