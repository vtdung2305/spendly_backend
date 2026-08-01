import { Injectable } from '@nestjs/common';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { SavingsGoalProgressService } from '../services/savings-goal-progress.service';

@Injectable()
export class ListSavingsGoalsUseCase {
  constructor(
    private readonly repo: SavingsGoalsRepository,
    private readonly progress: SavingsGoalProgressService,
  ) {}

  async execute(userId: string) {
    const goals = await this.repo.findAllForUser(userId);

    return Promise.all(
      goals.map(async (goal) => {
        const targetAmount = Number(goal.targetAmount);
        const { currentAmount, percent } = await this.progress.computeProgress(userId, goal.year, targetAmount);
        return { id: goal.id, year: goal.year, targetAmount, currentAmount, percent };
      }),
    );
  }
}
