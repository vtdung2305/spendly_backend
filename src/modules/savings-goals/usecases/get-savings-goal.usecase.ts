import { Injectable } from '@nestjs/common';
import { SavingsGoal } from '@prisma/client';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { SavingsGoalProgressService } from '../services/savings-goal-progress.service';

const EMPTY_RESULT = {
  id: null as string | null,
  name: null as string | null,
  targetAmount: 0,
  currentAmount: 0,
  percent: 0,
  deadline: null as Date | null,
};

@Injectable()
export class GetSavingsGoalUseCase {
  constructor(
    private readonly repo: SavingsGoalsRepository,
    private readonly progress: SavingsGoalProgressService,
  ) {}

  /** The goal featured on the Dashboard: the one with the nearest deadline, preferring goals not yet due. */
  private pickFeaturedGoal(goals: SavingsGoal[]): SavingsGoal | null {
    if (goals.length === 0) return null;
    const now = new Date();
    const upcoming = goals.filter((g) => g.deadline >= now).sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
    if (upcoming.length > 0) return upcoming[0];

    return [...goals].sort((a, b) => b.deadline.getTime() - a.deadline.getTime())[0];
  }

  async execute(userId: string) {
    const goals = await this.repo.findAllForUser(userId);
    const goal = this.pickFeaturedGoal(goals);
    if (!goal) return EMPTY_RESULT;

    const targetAmount = Number(goal.targetAmount);
    const initialAmount = Number(goal.initialAmount);
    const { currentAmount, percent } = await this.progress.computeProgress(
      userId,
      goal.createdAt,
      goal.deadline,
      targetAmount,
      initialAmount,
    );

    return { id: goal.id, name: goal.name, targetAmount, currentAmount, percent, deadline: goal.deadline };
  }
}
