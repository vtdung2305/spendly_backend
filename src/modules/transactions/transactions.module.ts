import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
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
import { CheckBudgetAlertUseCase } from './usecases/check-budget-alert.usecase';
import { CheckDailyRemindersUseCase } from './usecases/check-daily-reminders.usecase';
import { DailyReminderProcessor } from './jobs/daily-reminder.processor';
import { DailyReminderSchedulerService } from './jobs/daily-reminder-scheduler.service';
import { DAILY_REMINDER_QUEUE } from './jobs/daily-reminder-queue.constants';
import { BudgetsModule } from '../budgets/budgets.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [BudgetsModule, NotificationsModule, BullModule.registerQueue({ name: DAILY_REMINDER_QUEUE })],
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
    CheckBudgetAlertUseCase,
    CheckDailyRemindersUseCase,
    DailyReminderProcessor,
    DailyReminderSchedulerService,
  ],
  exports: [TransactionsQueryService, GetDailySummaryUseCase, CreateTransactionUseCase],
})
export class TransactionsModule {}
