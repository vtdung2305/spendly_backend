import { NotFoundException } from '@nestjs/common';
import { UpdateSavingsGoalUseCase } from './update-savings-goal.usecase';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';

describe('UpdateSavingsGoalUseCase', () => {
  let useCase: UpdateSavingsGoalUseCase;
  let repo: jest.Mocked<SavingsGoalsRepository>;

  beforeEach(() => {
    repo = { findByIdForUser: jest.fn(), update: jest.fn() } as any;
    useCase = new UpdateSavingsGoalUseCase(repo);
  });

  it('throws NotFoundException when no goal exists with that id for this user', async () => {
    repo.findByIdForUser.mockResolvedValue(null);

    await expect(useCase.execute('user-1', 'goal-1', { targetAmount: 1 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('updates the fields of the existing goal', async () => {
    repo.findByIdForUser.mockResolvedValue({ id: 'goal-1' } as any);
    repo.update.mockResolvedValue({ id: 'goal-1', targetAmount: 400000000 } as any);

    const result = await useCase.execute('user-1', 'goal-1', {
      name: 'Updated name',
      targetAmount: 400000000,
      deadline: '2027-01-31',
      initialAmount: 2000000,
    });

    expect(repo.update).toHaveBeenCalledWith('goal-1', {
      name: 'Updated name',
      targetAmount: 400000000,
      deadline: new Date('2027-01-31'),
      initialAmount: 2000000,
    });
    expect(result).toEqual({ id: 'goal-1', targetAmount: 400000000 });
  });

  it('leaves the deadline untouched when not provided', async () => {
    repo.findByIdForUser.mockResolvedValue({ id: 'goal-1' } as any);
    repo.update.mockResolvedValue({ id: 'goal-1' } as any);

    await useCase.execute('user-1', 'goal-1', { targetAmount: 100 });

    expect(repo.update).toHaveBeenCalledWith('goal-1', {
      name: undefined,
      targetAmount: 100,
      deadline: undefined,
      initialAmount: undefined,
    });
  });
});
