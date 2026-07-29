import { TransactionType } from '@prisma/client';
import { GetDashboardSummaryUseCase } from './get-dashboard-summary.usecase';
import { TransactionsQueryService } from '../../transactions/services/transactions-query.service';
import { GetDailySummaryUseCase } from '../../transactions/usecases/get-daily-summary.usecase';
import { BudgetsQueryService } from '../../budgets/services/budgets-query.service';
import { GetSavingsGoalUseCase } from '../../savings-goals/usecases/get-savings-goal.usecase';
import { PrismaService } from '../../../prisma/prisma.service';

describe('GetDashboardSummaryUseCase', () => {
  let useCase: GetDashboardSummaryUseCase;
  let transactionsQuery: jest.Mocked<TransactionsQueryService>;
  let getDailySummaryUseCase: jest.Mocked<GetDailySummaryUseCase>;
  let budgetsQuery: jest.Mocked<BudgetsQueryService>;
  let getSavingsGoalUseCase: jest.Mocked<GetSavingsGoalUseCase>;
  let prisma: { transaction: { groupBy: jest.Mock }; category: { findMany: jest.Mock } };

  beforeEach(() => {
    transactionsQuery = {
      sumByTypeInRange: jest.fn(),
      recentForUser: jest.fn().mockResolvedValue([]),
    } as any;
    getDailySummaryUseCase = { execute: jest.fn().mockResolvedValue([]) } as any;
    budgetsQuery = { listForMonth: jest.fn() } as any;
    getSavingsGoalUseCase = { execute: jest.fn() } as any;
    prisma = {
      transaction: { groupBy: jest.fn().mockResolvedValue([]) },
      category: { findMany: jest.fn().mockResolvedValue([]) },
    };

    useCase = new GetDashboardSummaryUseCase(
      transactionsQuery,
      getDailySummaryUseCase,
      budgetsQuery,
      getSavingsGoalUseCase,
      prisma as unknown as PrismaService,
    );
  });

  it('surfaces an overBudgetAlert only when a budget is over its limit', async () => {
    transactionsQuery.sumByTypeInRange.mockImplementation(async (_u, type: TransactionType) =>
      type === TransactionType.INCOME ? 45000000 : 18500000,
    );
    budgetsQuery.listForMonth.mockResolvedValue([
      { category: { id: 'cat-1', name: 'Ăn uống' }, isOverBudget: false, usedPercent: 80, limitAmount: 5000000, spentAmount: 4000000 },
      { category: { id: 'cat-2', name: 'Giải trí' }, isOverBudget: true, usedPercent: 112, limitAmount: 1000000, spentAmount: 1120000 },
    ] as any);
    getSavingsGoalUseCase.execute.mockResolvedValue({ year: 2026, targetAmount: 300000000, currentAmount: 159000000, percent: 53 });

    const result = await useCase.execute('user-1', '2026-07');

    expect(result.savings).toBe(26500000);
    expect(result.budget.totalLimit).toBe(6000000);
    expect(result.budget.totalSpent).toBe(5120000);
    expect(result.overBudgetAlert).toMatchObject({ categoryId: 'cat-2', name: 'Giải trí', overPercent: 12 });
  });

  it('returns overBudgetAlert null when no budget is over its limit', async () => {
    transactionsQuery.sumByTypeInRange.mockResolvedValue(0);
    budgetsQuery.listForMonth.mockResolvedValue([
      { category: { id: 'cat-1', name: 'Ăn uống' }, isOverBudget: false, usedPercent: 50, limitAmount: 1000000, spentAmount: 500000 },
    ] as any);
    getSavingsGoalUseCase.execute.mockResolvedValue({ year: 2026, targetAmount: 0, currentAmount: 0, percent: 0 });

    const result = await useCase.execute('user-1', '2026-07');

    expect(result.overBudgetAlert).toBeNull();
  });
});
