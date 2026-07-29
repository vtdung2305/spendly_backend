import { Injectable } from '@nestjs/common';
import { ListBudgetsUseCase } from '../usecases/list-budgets.usecase';

/**
 * Read-only surface for other modules (Dashboard) — avoids importing BudgetsRepository directly.
 */
@Injectable()
export class BudgetsQueryService {
  constructor(private readonly listBudgetsUseCase: ListBudgetsUseCase) {}

  listForMonth(userId: string, month: string) {
    return this.listBudgetsUseCase.execute(userId, month);
  }
}
