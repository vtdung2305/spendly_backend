import { Injectable, NotFoundException } from '@nestjs/common';
import { RecurringTransactionsRepository } from '../repositories/recurring-transactions.repository';

@Injectable()
export class GetRecurringTransactionUseCase {
  constructor(private readonly repo: RecurringTransactionsRepository) {}

  async execute(id: string, userId: string) {
    const recurring = await this.repo.findByIdForUser(id, userId);
    if (!recurring) throw new NotFoundException('Recurring transaction not found');
    return recurring;
  }
}
