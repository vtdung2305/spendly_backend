import { Injectable, NotFoundException } from '@nestjs/common';
import { BudgetsRepository } from '../repositories/budgets.repository';

@Injectable()
export class DeleteBudgetUseCase {
  constructor(private readonly repo: BudgetsRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const budget = await this.repo.findByIdForUser(id, userId);
    if (!budget) throw new NotFoundException('Budget not found');
    await this.repo.softDelete(id);
  }
}
