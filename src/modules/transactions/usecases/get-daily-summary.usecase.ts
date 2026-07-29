import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { DailySummaryQueryDto } from '../dto/daily-summary-query.dto';

@Injectable()
export class GetDailySummaryUseCase {
  constructor(private readonly repo: TransactionsRepository) {}

  async execute(userId: string, query: DailySummaryQueryDto) {
    const [year, month] = query.month.split('-').map(Number);
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 1);

    const rows = await this.repo.dailyTotalsInRange(userId, TransactionType.EXPENSE, from, to);
    const totalsByDate = new Map<string, number>();
    for (const row of rows) {
      const key = row.occurredAt.toISOString().slice(0, 10);
      totalsByDate.set(key, (totalsByDate.get(key) ?? 0) + Number(row._sum.amount ?? 0));
    }

    const days: Array<{ date: string; total: number }> = [];
    for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, total: totalsByDate.get(key) ?? 0 });
    }

    return days;
  }
}
