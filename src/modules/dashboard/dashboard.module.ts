import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { GetDashboardSummaryUseCase } from './usecases/get-dashboard-summary.usecase';
import { TransactionsModule } from '../transactions/transactions.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { SavingsGoalsModule } from '../savings-goals/savings-goals.module';

@Module({
  imports: [TransactionsModule, BudgetsModule, SavingsGoalsModule],
  controllers: [DashboardController],
  providers: [GetDashboardSummaryUseCase],
})
export class DashboardModule {}
