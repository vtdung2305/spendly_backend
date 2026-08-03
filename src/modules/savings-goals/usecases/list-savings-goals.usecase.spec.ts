import { ListSavingsGoalsUseCase } from './list-savings-goals.usecase';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { SavingsGoalProgressService } from '../services/savings-goal-progress.service';

describe('ListSavingsGoalsUseCase', () => {
  let useCase: ListSavingsGoalsUseCase;
  let repo: jest.Mocked<SavingsGoalsRepository>;
  let progress: jest.Mocked<SavingsGoalProgressService>;

  beforeEach(() => {
    repo = { findAllForUser: jest.fn() } as any;
    progress = { computeProgress: jest.fn() } as any;
    useCase = new ListSavingsGoalsUseCase(repo, progress);
  });

  it('returns an empty list when the user has no goals', async () => {
    repo.findAllForUser.mockResolvedValue([]);

    const result = await useCase.execute('user-1');

    expect(result).toEqual([]);
  });

  it('computes progress independently for each goal using its own createdAt/deadline window', async () => {
    const carGoal = {
      id: 'g-car',
      name: 'Xe máy mới',
      targetAmount: 500000000,
      initialAmount: 0,
      createdAt: new Date('2027-01-01'),
      deadline: new Date('2027-06-30'),
    };
    const tripGoal = {
      id: 'g-trip',
      name: 'Du lịch 2026',
      targetAmount: 300000000,
      initialAmount: 1000000,
      createdAt: new Date('2026-01-01'),
      deadline: new Date('2026-12-31'),
    };
    repo.findAllForUser.mockResolvedValue([carGoal, tripGoal] as any);
    progress.computeProgress.mockImplementation(async (_u, _from, deadline: Date) =>
      deadline.getFullYear() === 2027 ? { currentAmount: 0, percent: 0 } : { currentAmount: 159000000, percent: 53 },
    );

    const result = await useCase.execute('user-1');

    expect(progress.computeProgress).toHaveBeenCalledWith('user-1', carGoal.createdAt, carGoal.deadline, 500000000, 0);
    expect(progress.computeProgress).toHaveBeenCalledWith('user-1', tripGoal.createdAt, tripGoal.deadline, 300000000, 1000000);
    expect(result).toEqual([
      { id: 'g-car', name: 'Xe máy mới', targetAmount: 500000000, initialAmount: 0, deadline: carGoal.deadline, currentAmount: 0, percent: 0 },
      { id: 'g-trip', name: 'Du lịch 2026', targetAmount: 300000000, initialAmount: 1000000, deadline: tripGoal.deadline, currentAmount: 159000000, percent: 53 },
    ]);
  });
});
