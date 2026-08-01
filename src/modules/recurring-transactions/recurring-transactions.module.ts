import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RecurringTransactionsController } from './recurring-transactions.controller';
import { RecurringTransactionsRepository } from './repositories/recurring-transactions.repository';
import { ListRecurringTransactionsUseCase } from './usecases/list-recurring-transactions.usecase';
import { GetRecurringTransactionUseCase } from './usecases/get-recurring-transaction.usecase';
import { CreateRecurringTransactionUseCase } from './usecases/create-recurring-transaction.usecase';
import { UpdateRecurringTransactionUseCase } from './usecases/update-recurring-transaction.usecase';
import { DeleteRecurringTransactionUseCase } from './usecases/delete-recurring-transaction.usecase';
import { GenerateRecurringTransactionsUseCase } from './usecases/generate-recurring-transactions.usecase';
import { RecurringTransactionsProcessor } from './queue/recurring-transactions.processor';
import { RecurringTransactionsSchedulerService } from './queue/recurring-transactions-scheduler.service';
import { RECURRING_TRANSACTIONS_QUEUE } from './queue/recurring-transactions-queue.constants';
import { TransactionsModule } from '../transactions/transactions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TransactionsModule, NotificationsModule, BullModule.registerQueue({ name: RECURRING_TRANSACTIONS_QUEUE })],
  controllers: [RecurringTransactionsController],
  providers: [
    RecurringTransactionsRepository,
    ListRecurringTransactionsUseCase,
    GetRecurringTransactionUseCase,
    CreateRecurringTransactionUseCase,
    UpdateRecurringTransactionUseCase,
    DeleteRecurringTransactionUseCase,
    GenerateRecurringTransactionsUseCase,
    RecurringTransactionsProcessor,
    RecurringTransactionsSchedulerService,
  ],
})
export class RecurringTransactionsModule {}
