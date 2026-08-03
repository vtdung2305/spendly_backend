import { NotFoundException } from '@nestjs/common';
import { DeleteSavingsGoalUseCase } from './delete-savings-goal.usecase';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';

describe('DeleteSavingsGoalUseCase', () => {
  let useCase: DeleteSavingsGoalUseCase;
  let repo: jest.Mocked<SavingsGoalsRepository>;

  beforeEach(() => {
    repo = { findByIdForUser: jest.fn(), softDelete: jest.fn() } as any;
    useCase = new DeleteSavingsGoalUseCase(repo);
  });

  it('throws NotFoundException when no goal exists with that id for this user', async () => {
    repo.findByIdForUser.mockResolvedValue(null);

    await expect(useCase.execute('user-1', 'goal-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('soft-deletes the goal by id', async () => {
    repo.findByIdForUser.mockResolvedValue({ id: 'goal-1' } as any);

    await useCase.execute('user-1', 'goal-1');

    expect(repo.softDelete).toHaveBeenCalledWith('goal-1');
  });
});
