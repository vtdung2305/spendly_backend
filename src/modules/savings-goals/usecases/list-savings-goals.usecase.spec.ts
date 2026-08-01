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

  it('computes progress independently for each goal across multiple years', async () => {
    repo.findAllForUser.mockResolvedValue([
      { id: 'g2027', year: 2027, targetAmount: 500000000 },
      { id: 'g2026', year: 2026, targetAmount: 300000000 },
    ] as any);
    progress.computeProgress.mockImplementation(async (_u, year) =>
      year === 2027 ? { currentAmount: 0, percent: 0 } : { currentAmount: 159000000, percent: 53 },
    );

    const result = await useCase.execute('user-1');

    expect(progress.computeProgress).toHaveBeenCalledWith('user-1', 2027, 500000000);
    expect(progress.computeProgress).toHaveBeenCalledWith('user-1', 2026, 300000000);
    expect(result).toEqual([
      { id: 'g2027', year: 2027, targetAmount: 500000000, currentAmount: 0, percent: 0 },
      { id: 'g2026', year: 2026, targetAmount: 300000000, currentAmount: 159000000, percent: 53 },
    ]);
  });
});
