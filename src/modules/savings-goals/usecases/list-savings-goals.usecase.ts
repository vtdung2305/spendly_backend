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
        const initialAmount = Number(goal.initialAmount);
        const { currentAmount, percent } = await this.progress.computeProgress(
          userId,
          goal.createdAt,
          goal.deadline,
          targetAmount,
          initialAmount,
        );
        return {
          id: goal.id,
          name: goal.name,
          targetAmount,
          initialAmount,
          deadline: goal.deadline,
          currentAmount,
          percent,
        };
      }),
    );
  }
}
