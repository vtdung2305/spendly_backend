import { Module } from '@nestjs/common';
import { BudgetsController } from './budgets.controller';
import { BudgetsRepository } from './repositories/budgets.repository';
import { ListBudgetsUseCase } from './usecases/list-budgets.usecase';
import { CreateBudgetUseCase } from './usecases/create-budget.usecase';
import { UpdateBudgetUseCase } from './usecases/update-budget.usecase';
import { DeleteBudgetUseCase } from './usecases/delete-budget.usecase';
import { GetBudgetStatusUseCase } from './usecases/get-budget-status.usecase';
import { BudgetsQueryService } from './services/budgets-query.service';

@Module({
  controllers: [BudgetsController],
  providers: [
    BudgetsRepository,
    ListBudgetsUseCase,
    CreateBudgetUseCase,
    UpdateBudgetUseCase,
    DeleteBudgetUseCase,
    GetBudgetStatusUseCase,
    BudgetsQueryService,
  ],
  exports: [BudgetsQueryService],
})
export class BudgetsModule {}
