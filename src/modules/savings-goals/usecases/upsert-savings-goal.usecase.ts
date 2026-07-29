import { Injectable } from '@nestjs/common';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { UpsertSavingsGoalDto } from '../dto/upsert-savings-goal.dto';

@Injectable()
export class UpsertSavingsGoalUseCase {
  constructor(private readonly repo: SavingsGoalsRepository) {}

  async execute(userId: string, year: number, dto: UpsertSavingsGoalDto) {
    return this.repo.upsert(userId, year, dto.targetAmount);
  }
}
