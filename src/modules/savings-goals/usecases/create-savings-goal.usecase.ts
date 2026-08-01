import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { CreateSavingsGoalDto } from '../dto/create-savings-goal.dto';

@Injectable()
export class CreateSavingsGoalUseCase {
  constructor(private readonly repo: SavingsGoalsRepository) {}

  async execute(userId: string, dto: CreateSavingsGoalDto) {
    const existing = await this.repo.findAnyByYear(userId, dto.year);

    if (existing && !existing.deletedAt) {
      throw new AppException(
        'SAVINGS_GOAL_ALREADY_EXISTS',
        'Bạn đã có mục tiêu tiết kiệm cho năm này',
        HttpStatus.CONFLICT,
      );
    }

    // A goal for this year existed before but was deleted — the DB's unique
    // constraint on (userId, year) doesn't know about soft-delete, so revive
    // the old row instead of inserting a new one (which would violate it).
    if (existing) {
      return this.repo.revive(existing.id, dto.targetAmount);
    }

    return this.repo.create(userId, dto.year, dto.targetAmount);
  }
}
