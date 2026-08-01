import { Injectable, NotFoundException } from '@nestjs/common';
import { RecurringTransactionsRepository } from '../repositories/recurring-transactions.repository';

@Injectable()
export class DeleteRecurringTransactionUseCase {
  constructor(private readonly repo: RecurringTransactionsRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const recurring = await this.repo.findByIdForUser(id, userId);
    if (!recurring) throw new NotFoundException('Recurring transaction not found');
    await this.repo.softDelete(id);
  }
}
