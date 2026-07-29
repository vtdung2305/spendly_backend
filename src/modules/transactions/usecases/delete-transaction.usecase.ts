import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionsRepository } from '../repositories/transactions.repository';

@Injectable()
export class DeleteTransactionUseCase {
  constructor(private readonly repo: TransactionsRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const transaction = await this.repo.findByIdForUser(id, userId);
    if (!transaction) throw new NotFoundException('Transaction not found');
    await this.repo.softDelete(id);
  }
}
