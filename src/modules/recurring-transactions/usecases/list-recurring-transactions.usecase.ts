import { Injectable } from '@nestjs/common';
import { RecurringTransactionsRepository } from '../repositories/recurring-transactions.repository';

@Injectable()
export class ListRecurringTransactionsUseCase {
  constructor(private readonly repo: RecurringTransactionsRepository) {}

  execute(userId: string) {
    return this.repo.findAllForUser(userId);
  }
}
