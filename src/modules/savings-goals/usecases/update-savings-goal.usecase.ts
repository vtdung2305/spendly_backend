import { Injectable, NotFoundException } from '@nestjs/common';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { UpdateSavingsGoalDto } from '../dto/update-savings-goal.dto';

@Injectable()
export class UpdateSavingsGoalUseCase {
  constructor(private readonly repo: SavingsGoalsRepository) {}

  async execute(userId: string, id: string, dto: UpdateSavingsGoalDto) {
    const goal = await this.repo.findByIdForUser(id, userId);
    if (!goal) throw new NotFoundException('Savings goal not found');

    return this.repo.update(id, {
      name: dto.name,
      targetAmount: dto.targetAmount,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      initialAmount: dto.initialAmount,
    });
  }
}
