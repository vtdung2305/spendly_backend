import { Injectable } from '@nestjs/common';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { CreateSavingsGoalDto } from '../dto/create-savings-goal.dto';

@Injectable()
export class CreateSavingsGoalUseCase {
  constructor(private readonly repo: SavingsGoalsRepository) {}

  async execute(userId: string, dto: CreateSavingsGoalDto) {
    return this.repo.create(userId, {
      name: dto.name,
      targetAmount: dto.targetAmount,
      deadline: new Date(dto.deadline),
      initialAmount: dto.initialAmount,
    });
  }
}
