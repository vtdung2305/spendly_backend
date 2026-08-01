import { Injectable, NotFoundException } from '@nestjs/common';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';

@Injectable()
export class DeleteSavingsGoalUseCase {
  constructor(private readonly repo: SavingsGoalsRepository) {}

  async execute(userId: string, year: number): Promise<void> {
    const goal = await this.repo.findByYear(userId, year);
    if (!goal) throw new NotFoundException('Savings goal not found');

    await this.repo.softDelete(goal.id);
  }
}
