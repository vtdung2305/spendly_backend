import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionsRepository } from '../repositories/transactions.repository';

@Injectable()
export class GetTransactionUseCase {
  constructor(private readonly repo: TransactionsRepository) {}

  async execute(id: string, userId: string) {
    const transaction = await this.repo.findByIdForUser(id, userId);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }
}
