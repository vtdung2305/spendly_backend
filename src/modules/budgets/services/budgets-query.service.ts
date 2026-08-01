import { Injectable } from '@nestjs/common';
import { ListBudgetsUseCase } from '../usecases/list-budgets.usecase';
import { GetBudgetStatusUseCase } from '../usecases/get-budget-status.usecase';

/**
 * Read-only surface for other modules (Dashboard, Transactions) — avoids
 * importing BudgetsRepository directly.
 */
@Injectable()
export class BudgetsQueryService {
  constructor(
    private readonly listBudgetsUseCase: ListBudgetsUseCase,
    private readonly getBudgetStatusUseCase: GetBudgetStatusUseCase,
  ) {}

  listForMonth(userId: string, month: string) {
    return this.listBudgetsUseCase.execute(userId, month);
  }

  getStatus(userId: string, categoryId: string, month: string) {
    return this.getBudgetStatusUseCase.execute(userId, categoryId, month);
  }
}
