import { NotFoundException } from '@nestjs/common';
import { UpdateSavingsGoalUseCase } from './update-savings-goal.usecase';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';

describe('UpdateSavingsGoalUseCase', () => {
  let useCase: UpdateSavingsGoalUseCase;
  let repo: jest.Mocked<SavingsGoalsRepository>;

  beforeEach(() => {
    repo = { findByYear: jest.fn(), update: jest.fn() } as any;
    useCase = new UpdateSavingsGoalUseCase(repo);
  });

  it('throws NotFoundException when no goal exists for that year', async () => {
    repo.findByYear.mockResolvedValue(null);

    await expect(useCase.execute('user-1', 2026, { targetAmount: 1 })).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('updates the target amount of the existing goal', async () => {
    repo.findByYear.mockResolvedValue({ id: 'goal-1' } as any);
    repo.update.mockResolvedValue({ id: 'goal-1', targetAmount: 400000000 } as any);

    const result = await useCase.execute('user-1', 2026, { targetAmount: 400000000 });

    expect(repo.update).toHaveBeenCalledWith('goal-1', 400000000);
    expect(result).toEqual({ id: 'goal-1', targetAmount: 400000000 });
  });
});
