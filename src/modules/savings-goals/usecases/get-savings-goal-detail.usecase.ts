import { Injectable, NotFoundException } from '@nestjs/common';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { SavingsGoalProgressService } from '../services/savings-goal-progress.service';

@Injectable()
export class GetSavingsGoalDetailUseCase {
  constructor(
    private readonly repo: SavingsGoalsRepository,
    private readonly progress: SavingsGoalProgressService,
  ) {}

  async execute(userId: string, year: number) {
    const goal = await this.repo.findByYear(userId, year);
    if (!goal) throw new NotFoundException('Savings goal not found');

    const targetAmount = Number(goal.targetAmount);
    const [{ currentAmount, percent }, { deadline, avgPerMonth, contributionCount, history }] = await Promise.all([
      this.progress.computeProgress(userId, year, targetAmount),
      this.progress.computeHistory(userId, year),
    ]);

    return {
      id: goal.id,
      year,
      targetAmount,
      currentAmount,
      percent,
      deadline,
      avgPerMonth,
      contributionCount,
      history,
    };
  }
}
