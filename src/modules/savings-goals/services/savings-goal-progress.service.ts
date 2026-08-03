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

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
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
 * net (income − expense) for each elapsed month between the goal's creation
 * and its deadline, matching the Dashboard's derived-savings figure.
 */
@Injectable()
export class SavingsGoalProgressService {
  constructor(private readonly transactionsQuery: TransactionsQueryService) {}

  private elapsedTo(deadline: Date): Date {
    const now = new Date();
    return now < deadline ? now : deadline;
  }

  async computeProgress(
    userId: string,
    from: Date,
    deadline: Date,
    targetAmount: number,
    initialAmount: number,
  ): Promise<SavingsGoalProgress> {
    const to = this.elapsedTo(deadline);
    const [income, expense] = await Promise.all([
      this.transactionsQuery.sumByTypeInRange(userId, TransactionType.INCOME, from, to),
      this.transactionsQuery.sumByTypeInRange(userId, TransactionType.EXPENSE, from, to),
    ]);
    const currentAmount = initialAmount + Math.max(0, income - expense);
    return {
      currentAmount,
      percent: targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 1000) / 10 : 0,
    };
  }

  async computeHistory(userId: string, from: Date, deadline: Date): Promise<SavingsGoalHistory> {
    const elapsedEnd = this.elapsedTo(deadline);
    const months: Date[] = [];
    for (let cursor = startOfMonth(from); cursor <= elapsedEnd; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
      months.push(cursor);
    }

    const entries = await Promise.all(
      months.map(async (monthStart) => {
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
        const [income, expense] = await Promise.all([
          this.transactionsQuery.sumByTypeInRange(userId, TransactionType.INCOME, monthStart, monthEnd),
          this.transactionsQuery.sumByTypeInRange(userId, TransactionType.EXPENSE, monthStart, monthEnd),
        ]);
        const lastDayOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        return {
          label: `Đóng góp tháng ${monthStart.getMonth() + 1}`,
          date: localYmd(lastDayOfMonth),
          amount: income - expense,
        };
      }),
    );

    entries.reverse(); // most recent month first, matching the design's history list

    return {
      deadline: localYmd(deadline),
      avgPerMonth: entries.length > 0 ? Math.round(entries.reduce((sum, e) => sum + e.amount, 0) / entries.length) : 0,
      contributionCount: entries.length,
      history: entries,
    };
  }
}
