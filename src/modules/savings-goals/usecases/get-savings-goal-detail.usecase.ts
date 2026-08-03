import { Injectable, NotFoundException } from '@nestjs/common';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { SavingsGoalProgressService } from '../services/savings-goal-progress.service';

@Injectable()
export class GetSavingsGoalDetailUseCase {
  constructor(
    private readonly repo: SavingsGoalsRepository,
    private readonly progress: SavingsGoalProgressService,
  ) {}

  async execute(userId: string, id: string) {
    const goal = await this.repo.findByIdForUser(id, userId);
    if (!goal) throw new NotFoundException('Savings goal not found');

    const targetAmount = Number(goal.targetAmount);
    const initialAmount = Number(goal.initialAmount);
    const [{ currentAmount, percent }, { deadline, avgPerMonth, contributionCount, history }] = await Promise.all([
      this.progress.computeProgress(userId, goal.createdAt, goal.deadline, targetAmount, initialAmount),
      this.progress.computeHistory(userId, goal.createdAt, goal.deadline),
    ]);

    return {
      id: goal.id,
      name: goal.name,
      targetAmount,
      initialAmount,
      currentAmount,
      percent,
      deadline,
      avgPerMonth,
      contributionCount,
      history,
    };
  }
}
