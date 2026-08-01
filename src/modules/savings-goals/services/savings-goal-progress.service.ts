import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { TransactionsQueryService } from '../../transactions/services/transactions-query.service';

// Dates here are constructed in local time; toISOString() would shift them to the
// previous day in any UTC+ timezone, so format in local time instead.
function localYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface SavingsGoalProgress {
  currentAmount: number;
  percent: number;
}

export interface SavingsGoalHistoryEntry {
  label: string;
  date: string;
  amount: number;
}

export interface SavingsGoalHistory {
  deadline: string;
  avgPerMonth: number;
  contributionCount: number;
  history: SavingsGoalHistoryEntry[];
}

/**
 * Shared savings-goal math for GetSavingsGoalUseCase (Dashboard card — cheap),
 * ListSavingsGoalsUseCase, and GetSavingsGoalDetailUseCase (goal detail screen —
 * also computes the per-month "contribution" breakdown, so kept out of the
 * Dashboard-facing use case to avoid slowing that hot path down).
 *
 * "Contribution" here is not a separate ledger the user writes to — it's the
 * net (income − expense) for each elapsed month of the goal's year, matching
 * the Dashboard's derived-savings figure.
 */
@Injectable()
export class SavingsGoalProgressService {
  constructor(private readonly transactionsQuery: TransactionsQueryService) {}

  private elapsedRange(year: number): { from: Date; to: Date } {
    const now = new Date();
    const from = new Date(year, 0, 1);
    const to =
      now.getFullYear() === year
        ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
        : new Date(year + 1, 0, 1);
    return { from, to };
  }

  private elapsedMonthCount(year: number): number {
    const now = new Date();
    if (year < now.getFullYear()) return 12;
    if (year > now.getFullYear()) return 0;
    return now.getMonth() + 1;
  }

  async computeProgress(userId: string, year: number, targetAmount: number): Promise<SavingsGoalProgress> {
    const { from, to } = this.elapsedRange(year);
    const [income, expense] = await Promise.all([
      this.transactionsQuery.sumByTypeInRange(userId, TransactionType.INCOME, from, to),
      this.transactionsQuery.sumByTypeInRange(userId, TransactionType.EXPENSE, from, to),
    ]);
    const currentAmount = Math.max(0, income - expense);
    return {
      currentAmount,
      percent: targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 1000) / 10 : 0,
    };
  }

  async computeHistory(userId: string, year: number): Promise<SavingsGoalHistory> {
    const monthCount = this.elapsedMonthCount(year);

    const entries = await Promise.all(
      Array.from({ length: monthCount }, (_, m) => m).map(async (m) => {
        const from = new Date(year, m, 1);
        const to = new Date(year, m + 1, 1);
        const [income, expense] = await Promise.all([
          this.transactionsQuery.sumByTypeInRange(userId, TransactionType.INCOME, from, to),
          this.transactionsQuery.sumByTypeInRange(userId, TransactionType.EXPENSE, from, to),
        ]);
        const lastDayOfMonth = new Date(year, m + 1, 0);
        return {
          label: `Đóng góp tháng ${m + 1}`,
          date: localYmd(lastDayOfMonth),
          amount: income - expense,
        };
      }),
    );

    entries.reverse(); // most recent month first, matching the design's history list

    return {
      deadline: localYmd(new Date(year, 11, 31)),
      avgPerMonth: monthCount > 0 ? Math.round(entries.reduce((sum, e) => sum + e.amount, 0) / monthCount) : 0,
      contributionCount: monthCount,
      history: entries,
    };
  }
}
