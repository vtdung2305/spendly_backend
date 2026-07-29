import { Injectable } from '@nestjs/common';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { QueryTransactionDto } from '../dto/query-transaction.dto';

@Injectable()
export class ListTransactionsUseCase {
  constructor(private readonly repo: TransactionsRepository) {}

  async execute(userId: string, query: QueryTransactionDto) {
    const { data, cursor, hasMore } = await this.repo.findMany({ userId, ...query });
    return { data, meta: { cursor, hasMore } };
  }
}
