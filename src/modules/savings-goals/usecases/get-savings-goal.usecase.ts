import { Injectable } from '@nestjs/common';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { SavingsGoalProgressService } from '../services/savings-goal-progress.service';

@Injectable()
export class GetSavingsGoalUseCase {
  constructor(
    private readonly repo: SavingsGoalsRepository,
    private readonly progress: SavingsGoalProgressService,
  ) {}

  async execute(userId: string, year: number) {
    const goal = await this.repo.findByYear(userId, year);
    const targetAmount = goal ? Number(goal.targetAmount) : 0;
    const { currentAmount, percent } = await this.progress.computeProgress(userId, year, targetAmount);

    return { year, targetAmount, currentAmount, percent };
  }
}
