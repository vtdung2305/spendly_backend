import { TransactionType } from '@prisma/client';
import { GetSavingsGoalUseCase } from './get-savings-goal.usecase';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { TransactionsQueryService } from '../../transactions/services/transactions-query.service';

describe('GetSavingsGoalUseCase', () => {
  let useCase: GetSavingsGoalUseCase;
  let repo: jest.Mocked<SavingsGoalsRepository>;
  let transactionsQuery: jest.Mocked<TransactionsQueryService>;

  beforeEach(() => {
    repo = { findByYear: jest.fn() } as any;
    transactionsQuery = { sumByTypeInRange: jest.fn() } as any;
    useCase = new GetSavingsGoalUseCase(repo, transactionsQuery);
  });

  it('computes currentAmount as income minus expense and the percent toward target', async () => {
    repo.findByYear.mockResolvedValue({ year: 2026, targetAmount: 300000000 } as any);
    transactionsQuery.sumByTypeInRange.mockImplementation(async (_userId, type) =>
      type === TransactionType.INCOME ? 200000000 : 41000000,
    );

    const result = await useCase.execute('user-1', 2026);

    expect(result.currentAmount).toBe(159000000);
    expect(result.percent).toBe(53);
    expect(result.targetAmount).toBe(300000000);
  });

  it('clamps currentAmount at 0 when expense exceeds income (never negative savings)', async () => {
    repo.findByYear.mockResolvedValue({ year: 2026, targetAmount: 100000000 } as any);
    transactionsQuery.sumByTypeInRange.mockImplementation(async (_userId, type) =>
      type === TransactionType.INCOME ? 1000000 : 5000000,
    );

    const result = await useCase.execute('user-1', 2026);

    expect(result.currentAmount).toBe(0);
    expect(result.percent).toBe(0);
  });

  it('returns targetAmount 0 and percent 0 when no goal has been set yet', async () => {
    repo.findByYear.mockResolvedValue(null);
    transactionsQuery.sumByTypeInRange.mockResolvedValue(0);

    const result = await useCase.execute('user-1', 2026);

    expect(result.targetAmount).toBe(0);
    expect(result.percent).toBe(0);
  });
});
