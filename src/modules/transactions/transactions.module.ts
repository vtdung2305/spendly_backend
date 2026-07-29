import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsRepository } from './repositories/transactions.repository';
import { TransactionsQueryService } from './services/transactions-query.service';
import { CreateTransactionUseCase } from './usecases/create-transaction.usecase';
import { GetTransactionUseCase } from './usecases/get-transaction.usecase';
import { ListTransactionsUseCase } from './usecases/list-transactions.usecase';
import { UpdateTransactionUseCase } from './usecases/update-transaction.usecase';
import { DeleteTransactionUseCase } from './usecases/delete-transaction.usecase';
import { GetDailySummaryUseCase } from './usecases/get-daily-summary.usecase';
import { GetPeriodSummaryUseCase } from './usecases/get-period-summary.usecase';

@Module({
  controllers: [TransactionsController],
  providers: [
    TransactionsRepository,
    TransactionsQueryService,
    CreateTransactionUseCase,
    GetTransactionUseCase,
    ListTransactionsUseCase,
    UpdateTransactionUseCase,
    DeleteTransactionUseCase,
    GetDailySummaryUseCase,
    GetPeriodSummaryUseCase,
  ],
  exports: [TransactionsQueryService, GetDailySummaryUseCase],
})
export class TransactionsModule {}
