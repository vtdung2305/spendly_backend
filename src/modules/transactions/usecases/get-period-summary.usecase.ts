import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { PeriodSummaryQueryDto } from '../dto/period-summary-query.dto';
import { resolvePeriodRange } from '../utils/period-range.util';

@Injectable()
export class GetPeriodSummaryUseCase {
  constructor(
    private readonly repo: TransactionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, query: PeriodSummaryQueryDto) {
    const range = resolvePeriodRange(query.period, new Date(query.date));
    const now = new Date();
    const effectiveTo = range.to > now ? now : range.to;
    const elapsedDays = Math.max(1, Math.round((effectiveTo.getTime() - range.from.getTime()) / 86_400_000));

    const [income, expense, dailyExpenseRows, categoryRows] = await Promise.all([
      this.repo.sumByTypeInRange(userId, TransactionType.INCOME, range.from, range.to),
      this.repo.sumByTypeInRange(userId, TransactionType.EXPENSE, range.from, range.to),
      this.repo.dailyTotalsInRange(userId, TransactionType.EXPENSE, range.from, range.to),
      this.repo.categoryBreakdownInRange(userId, TransactionType.EXPENSE, range.from, range.to),
    ]);

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryRows.map((r) => r.categoryId) }, deletedAt: null },
    });
    const categoryBreakdown = categoryRows
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

    const chartBuckets = Array(range.bucketCount).fill(0);
    for (const row of dailyExpenseRows) {
      const idx = range.bucketOf(row.occurredAt);
      if (idx >= 0 && idx < chartBuckets.length) chartBuckets[idx] += Number(row._sum.amount ?? 0);
    }

    let highestSpendDay: { date: string; total: number } | null = null;
    for (const row of dailyExpenseRows) {
      const total = Number(row._sum.amount ?? 0);
      if (!highestSpendDay || total > highestSpendDay.total) {
        highestSpendDay = { date: row.occurredAt.toISOString().slice(0, 10), total };
      }
    }

    return {
      period: query.period,
      dateFrom: range.from.toISOString().slice(0, 10),
      dateTo: new Date(range.to.getTime() - 86_400_000).toISOString().slice(0, 10),
      income,
      expense,
      savingsRate: income > 0 ? Math.round(((income - expense) / income) * 1000) / 10 : 0,
      avgPerDay: Math.round((expense / elapsedDays) * 100) / 100,
      topCategory: categoryBreakdown[0] ?? null,
      highestSpendDay,
      categoryBreakdown,
      chart: { labels: range.bucketLabels, values: chartBuckets },
    };
  }
}
