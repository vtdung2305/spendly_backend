import { Injectable, NotFoundException } from '@nestjs/common';
import { BudgetsRepository } from '../repositories/budgets.repository';
import { UpdateBudgetDto } from '../dto/update-budget.dto';

@Injectable()
export class UpdateBudgetUseCase {
  constructor(private readonly repo: BudgetsRepository) {}

  async execute(id: string, userId: string, dto: UpdateBudgetDto) {
    const budget = await this.repo.findByIdForUser(id, userId);
    if (!budget) throw new NotFoundException('Budget not found');
    return this.repo.update(id, dto.limitAmount);
  }
}
