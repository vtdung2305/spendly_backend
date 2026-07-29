import { GetPeriodSummaryUseCase } from './get-period-summary.usecase';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { SummaryPeriod } from '../dto/period-summary-query.dto';

describe('GetPeriodSummaryUseCase', () => {
  let useCase: GetPeriodSummaryUseCase;
  let repo: jest.Mocked<TransactionsRepository>;
  let prisma: { category: { findMany: jest.Mock } };

  beforeEach(() => {
    repo = {
      sumByTypeInRange: jest.fn(),
      dailyTotalsInRange: jest.fn(),
      categoryBreakdownInRange: jest.fn(),
    } as any;
    prisma = { category: { findMany: jest.fn().mockResolvedValue([]) } };

    useCase = new GetPeriodSummaryUseCase(repo, prisma as unknown as PrismaService);
  });

  it('computes savingsRate, avgPerDay, topCategory and highestSpendDay for a MONTH period', async () => {
    repo.sumByTypeInRange.mockImplementation(async (_u, type) => (type === 'INCOME' ? 45000000 : 18500000));
    repo.dailyTotalsInRange.mockResolvedValue([
      { occurredAt: new Date('2026-07-01'), _sum: { amount: 250000 } },
      { occurredAt: new Date('2026-07-15'), _sum: { amount: 1200000 } },
    ] as any);
    repo.categoryBreakdownInRange.mockResolvedValue([
      { categoryId: 'cat-1', _sum: { amount: 5920000 } },
      { categoryId: 'cat-2', _sum: { amount: 4070000 } },
    ] as any);
    prisma.category.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'Ăn uống', color: '#4F46E5' },
      { id: 'cat-2', name: 'Shopping', color: '#F59E0B' },
    ]);

    const result = await useCase.execute('user-1', { period: SummaryPeriod.MONTH, date: '2026-07-15' });

    expect(result.income).toBe(45000000);
    expect(result.expense).toBe(18500000);
    expect(result.savingsRate).toBeCloseTo(58.9, 1);
    expect(result.topCategory).toMatchObject({ categoryId: 'cat-1', name: 'Ăn uống' });
    expect(result.highestSpendDay).toMatchObject({ date: '2026-07-15', total: 1200000 });
    expect(result.chart.labels).toEqual(['T1', 'T2', 'T3', 'T4', 'T5']);
  });

  it('reports savingsRate 0 when there is no income (avoids division by zero)', async () => {
    repo.sumByTypeInRange.mockResolvedValue(0);
    repo.dailyTotalsInRange.mockResolvedValue([]);
    repo.categoryBreakdownInRange.mockResolvedValue([]);

    const result = await useCase.execute('user-1', { period: SummaryPeriod.WEEK, date: '2026-07-29' });

    expect(result.savingsRate).toBe(0);
    expect(result.topCategory).toBeNull();
    expect(result.highestSpendDay).toBeNull();
  });
});
