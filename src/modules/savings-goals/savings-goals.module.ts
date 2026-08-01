import { Module } from '@nestjs/common';
import { SavingsGoalsController } from './savings-goals.controller';
import { SavingsGoalsRepository } from './repositories/savings-goals.repository';
import { SavingsGoalProgressService } from './services/savings-goal-progress.service';
import { GetSavingsGoalUseCase } from './usecases/get-savings-goal.usecase';
import { ListSavingsGoalsUseCase } from './usecases/list-savings-goals.usecase';
import { GetSavingsGoalDetailUseCase } from './usecases/get-savings-goal-detail.usecase';
import { CreateSavingsGoalUseCase } from './usecases/create-savings-goal.usecase';
import { UpdateSavingsGoalUseCase } from './usecases/update-savings-goal.usecase';
import { DeleteSavingsGoalUseCase } from './usecases/delete-savings-goal.usecase';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  controllers: [SavingsGoalsController],
  providers: [
    SavingsGoalsRepository,
    SavingsGoalProgressService,
    GetSavingsGoalUseCase,
    ListSavingsGoalsUseCase,
    GetSavingsGoalDetailUseCase,
    CreateSavingsGoalUseCase,
    UpdateSavingsGoalUseCase,
    DeleteSavingsGoalUseCase,
  ],
  exports: [GetSavingsGoalUseCase],
})
export class SavingsGoalsModule {}
