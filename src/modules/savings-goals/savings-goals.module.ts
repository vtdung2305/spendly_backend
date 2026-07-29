import { Module } from '@nestjs/common';
import { SavingsGoalsController } from './savings-goals.controller';
import { SavingsGoalsRepository } from './repositories/savings-goals.repository';
import { GetSavingsGoalUseCase } from './usecases/get-savings-goal.usecase';
import { UpsertSavingsGoalUseCase } from './usecases/upsert-savings-goal.usecase';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  controllers: [SavingsGoalsController],
  providers: [SavingsGoalsRepository, GetSavingsGoalUseCase, UpsertSavingsGoalUseCase],
  exports: [GetSavingsGoalUseCase],
})
export class SavingsGoalsModule {}
