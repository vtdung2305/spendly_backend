import { Injectable, NotFoundException } from '@nestjs/common';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { UpdateSavingsGoalDto } from '../dto/update-savings-goal.dto';

@Injectable()
export class UpdateSavingsGoalUseCase {
  constructor(private readonly repo: SavingsGoalsRepository) {}

  async execute(userId: string, year: number, dto: UpdateSavingsGoalDto) {
    const goal = await this.repo.findByYear(userId, year);
    if (!goal) throw new NotFoundException('Savings goal not found');

    return this.repo.update(goal.id, dto.targetAmount);
  }
}
