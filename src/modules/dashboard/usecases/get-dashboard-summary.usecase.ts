import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { TransactionsQueryService } from '../../transactions/services/transactions-query.service';
import { GetDailySummaryUseCase } from '../../transactions/usecases/get-daily-summary.usecase';
import { BudgetsQueryService } from '../../budgets/services/budgets-query.service';
import { GetSavingsGoalUseCase } from '../../savings-goals/usecases/get-savings-goal.usecase';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(
    private readonly transactionsQuery: TransactionsQueryService,
    private readonly getDailySummaryUseCase: GetDailySummaryUseCase,
    private readonly budgetsQuery: BudgetsQueryService,
    private readonly getSavingsGoalUseCase: GetSavingsGoalUseCase,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, month: string) {
    const [year, m] = month.split('-').map(Number);
    const from = new Date(year, m - 1, 1);
    const to = new Date(year, m, 1);

    const [income, expense, dailySpend, budgets, savingsGoal, recentTransactions] = await Promise.all([
      this.transactionsQuery.sumByTypeInRange(userId, TransactionType.INCOME, from, to),
      this.transactionsQuery.sumByTypeInRange(userId, TransactionType.EXPENSE, from, to),
      this.getDailySummaryUseCase.execute(userId, { month }),
      this.budgetsQuery.listForMonth(userId, month),
      this.getSavingsGoalUseCase.execute(userId, year),
      this.transactionsQuery.recentForUser(userId, 10),
    ]);

    const totalLimit = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const overBudget = budgets.find((b) => b.isOverBudget);

    const categoryTotals = new Map<string, { name: string; color: string; amount: number }>();
    for (const t of recentTransactions) {
      if (t.type !== TransactionType.EXPENSE) continue;
      const existing = categoryTotals.get(t.categoryId);
      const amount = Number(t.amount);
      if (existing) existing.amount += amount;
      else categoryTotals.set(t.categoryId, { name: t.category.name, color: t.category.color, amount });
    }
    // Category donut is derived from the full month's expense breakdown, not just the recent list.
    const monthCategoryRows = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: TransactionType.EXPENSE, occurredAt: { gte: from, lt: to } },
      _sum: { amount: true },
    });
    const categories = await this.prisma.category.findMany({
      where: { id: { in: monthCategoryRows.map((r) => r.categoryId) } },
    });
    const categoryBreakdown = monthCategoryRows
      .map((r) => {
        const category = categories.find((c) => c.id === r.categoryId);
        const amount = Number(r._sum.amount ?? 0);
        return {
          categoryId: r.categoryId,
          name: category?.name ?? 'Khác',
          color: category?.color ?? '#94A3B8',
          amount,
          percent: expense > 0 ? Math.round((amount / expense) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      month,
      income,
      expense,
      savings: income - expense,
      budget: {
        totalLimit,
        totalSpent,
        usedPercent: totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 1000) / 10 : 0,
        remaining: totalLimit - totalSpent,
      },
      savingsGoal,
      categoryBreakdown,
      dailySpend,
      recentTransactions,
      overBudgetAlert: overBudget
        ? {
            categoryId: overBudget.category.id,
            name: overBudget.category.name,
            overPercent: Math.round((overBudget.usedPercent - 100) * 10) / 10,
          }
        : null,
    };
  }
}
