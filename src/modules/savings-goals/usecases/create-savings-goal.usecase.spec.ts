import { CreateSavingsGoalUseCase } from './create-savings-goal.usecase';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';

describe('CreateSavingsGoalUseCase', () => {
  let useCase: CreateSavingsGoalUseCase;
  let repo: jest.Mocked<SavingsGoalsRepository>;

  beforeEach(() => {
    repo = { findAnyByYear: jest.fn(), create: jest.fn(), revive: jest.fn() } as any;
    useCase = new CreateSavingsGoalUseCase(repo);
  });

  it('throws SAVINGS_GOAL_ALREADY_EXISTS when an active goal for that year already exists', async () => {
    repo.findAnyByYear.mockResolvedValue({ id: 'existing', deletedAt: null } as any);

    await expect(useCase.execute('user-1', { year: 2026, targetAmount: 300000000 })).rejects.toMatchObject({
      code: 'SAVINGS_GOAL_ALREADY_EXISTS',
    });
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.revive).not.toHaveBeenCalled();
  });

  it('creates the goal when no goal has ever existed for that year', async () => {
    repo.findAnyByYear.mockResolvedValue(null);
    repo.create.mockResolvedValue({ id: 'new-goal' } as any);

    const result = await useCase.execute('user-1', { year: 2027, targetAmount: 500000000 });

    expect(repo.create).toHaveBeenCalledWith('user-1', 2027, 500000000);
    expect(repo.revive).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'new-goal' });
  });

  it('revives a previously soft-deleted goal instead of inserting (avoids a unique-constraint violation)', async () => {
    repo.findAnyByYear.mockResolvedValue({ id: 'old-goal', deletedAt: new Date('2026-01-01') } as any);
    repo.revive.mockResolvedValue({ id: 'old-goal', deletedAt: null, targetAmount: 999 } as any);

    const result = await useCase.execute('user-1', { year: 2027, targetAmount: 999 });

    expect(repo.revive).toHaveBeenCalledWith('old-goal', 999);
    expect(repo.create).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'old-goal', deletedAt: null, targetAmount: 999 });
  });
});
