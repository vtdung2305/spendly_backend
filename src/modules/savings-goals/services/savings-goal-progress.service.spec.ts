import { TransactionType } from '@prisma/client';
import { SavingsGoalProgressService } from './savings-goal-progress.service';
import { TransactionsQueryService } from '../../transactions/services/transactions-query.service';

describe('SavingsGoalProgressService', () => {
  let service: SavingsGoalProgressService;
  let transactionsQuery: jest.Mocked<TransactionsQueryService>;

  function mockNow(isoDate: string) {
    jest.useFakeTimers().setSystemTime(new Date(isoDate));
  }

  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    transactionsQuery = { sumByTypeInRange: jest.fn() } as any;
    service = new SavingsGoalProgressService(transactionsQuery);
  });

  describe('computeProgress', () => {
    it('computes currentAmount as income minus expense plus the initial amount, and the percent toward target', async () => {
      mockNow('2026-07-15');
      transactionsQuery.sumByTypeInRange.mockImplementation(async (_u, type) =>
        type === TransactionType.INCOME ? 200000000 : 41000000,
      );

      const result = await service.computeProgress(
        'user-1',
        new Date('2026-01-01'),
        new Date('2026-12-31'),
        300000000,
        0,
      );

      expect(result.currentAmount).toBe(159000000);
      expect(result.percent).toBe(53);
    });

    it('adds the initial (manually seeded) amount on top of the computed net savings', async () => {
      mockNow('2026-07-15');
      transactionsQuery.sumByTypeInRange.mockImplementation(async (_u, type) =>
        type === TransactionType.INCOME ? 200000000 : 41000000,
      );

      const result = await service.computeProgress(
        'user-1',
        new Date('2026-01-01'),
        new Date('2026-12-31'),
        300000000,
        1000000,
      );

      expect(result.currentAmount).toBe(160000000);
    });

    it('clamps the computed net at 0 when expense exceeds income (never negative savings)', async () => {
      mockNow('2026-07-15');
      transactionsQuery.sumByTypeInRange.mockImplementation(async (_u, type) =>
        type === TransactionType.INCOME ? 1000000 : 5000000,
      );

      const result = await service.computeProgress(
        'user-1',
        new Date('2026-01-01'),
        new Date('2026-12-31'),
        100000000,
        0,
      );

      expect(result.currentAmount).toBe(0);
      expect(result.percent).toBe(0);
    });

    it('returns percent 0 when targetAmount is 0 (avoids division by zero)', async () => {
      mockNow('2026-07-15');
      transactionsQuery.sumByTypeInRange.mockResolvedValue(0);

      const result = await service.computeProgress('user-1', new Date('2026-01-01'), new Date('2026-12-31'), 0, 0);

      expect(result.percent).toBe(0);
    });
  });

  describe('computeHistory', () => {
    it('only includes elapsed months up to today, newest first', async () => {
      mockNow('2026-03-15'); // Jan, Feb, Mar elapsed -> 3 months
      transactionsQuery.sumByTypeInRange.mockImplementation(async (_u, type, from: Date) => {
        const month = from.getMonth(); // 0=Jan
        const incomeByMonth = [10000000, 12000000, 15000000];
        const expenseByMonth = [4000000, 5000000, 6000000];
        return type === TransactionType.INCOME ? incomeByMonth[month] : expenseByMonth[month];
      });

      const result = await service.computeHistory('user-1', new Date('2026-01-01'), new Date('2026-12-31'));

      expect(result.contributionCount).toBe(3);
      expect(result.history).toHaveLength(3);
      expect(result.history[0].label).toBe('Đóng góp tháng 3'); // newest first
      expect(result.history[0].amount).toBe(15000000 - 6000000);
      expect(result.history[2].label).toBe('Đóng góp tháng 1');
      expect(result.avgPerMonth).toBe(
        Math.round((10000000 - 4000000 + (12000000 - 5000000) + (15000000 - 6000000)) / 3),
      );
      expect(result.deadline).toBe('2026-12-31');
    });

    it('returns zero months for a goal whose window has not started yet', async () => {
      mockNow('2026-01-01');
      transactionsQuery.sumByTypeInRange.mockResolvedValue(0);

      const result = await service.computeHistory('user-1', new Date('2027-01-01'), new Date('2027-12-31'));

      expect(result.contributionCount).toBe(0);
      expect(result.history).toEqual([]);
      expect(result.avgPerMonth).toBe(0);
    });

    it('returns all 12 months for a fully elapsed goal window', async () => {
      mockNow('2026-06-01');
      transactionsQuery.sumByTypeInRange.mockResolvedValue(1000000);

      const result = await service.computeHistory('user-1', new Date('2025-01-01'), new Date('2025-12-31'));

      expect(result.contributionCount).toBe(12);
      expect(result.history).toHaveLength(12);
    });

    it('stops at the deadline even when it is still in the future relative to a short window', async () => {
      mockNow('2026-01-15');
      transactionsQuery.sumByTypeInRange.mockResolvedValue(0);

      const result = await service.computeHistory('user-1', new Date('2026-01-01'), new Date('2026-02-10'));

      expect(result.contributionCount).toBe(1); // only January has elapsed so far
    });
  });
});
