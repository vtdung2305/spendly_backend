import { Injectable } from '@nestjs/common';
import { BudgetsRepository } from '../repositories/budgets.repository';

@Injectable()
export class ListBudgetsUseCase {
  constructor(private readonly repo: BudgetsRepository) {}

  async execute(userId: string, month: string) {
    const [budgets, spentMap] = await Promise.all([
      this.repo.findByMonth(userId, month),
      this.repo.spentByCategoryForMonth(userId, month),
    ]);

    return budgets.map((b) => {
      const spentAmount = spentMap.get(b.categoryId) ?? 0;
      const limitAmount = Number(b.limitAmount);
      return {
        id: b.id,
        month: b.month,
        category: { id: b.category.id, name: b.category.name, color: b.category.color, icon: b.category.icon },
        limitAmount,
        spentAmount,
        usedPercent: limitAmount > 0 ? Math.round((spentAmount / limitAmount) * 1000) / 10 : 0,
        isOverBudget: spentAmount > limitAmount,
      };
    });
  }
}
