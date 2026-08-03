import { Injectable, NotFoundException } from '@nestjs/common';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';

@Injectable()
export class DeleteSavingsGoalUseCase {
  constructor(private readonly repo: SavingsGoalsRepository) {}

  async execute(userId: string, id: string): Promise<void> {
    const goal = await this.repo.findByIdForUser(id, userId);
    if (!goal) throw new NotFoundException('Savings goal not found');

    await this.repo.softDelete(goal.id);
  }
}
