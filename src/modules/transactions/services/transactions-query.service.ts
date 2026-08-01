import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { TransactionsRepository } from '../repositories/transactions.repository';

/**
 * Read-only surface other modules (Budgets, SavingsGoals, Dashboard) depend on
 * instead of importing TransactionsRepository directly.
 */
@Injectable()
export class TransactionsQueryService {
  constructor(private readonly repo: TransactionsRepository) {}

  sumByTypeInRange(userId: string, type: TransactionType, from: Date, to: Date) {
    return this.repo.sumByTypeInRange(userId, type, from, to);
  }

  recentForUser(userId: string, limit: number) {
    return this.repo.recentForUser(userId, limit);
  }

  hasAnyOnDate(userId: string, from: Date, to: Date) {
    return this.repo.hasAnyOnDate(userId, from, to);
  }
}
