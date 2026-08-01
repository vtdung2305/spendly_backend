import { GetSavingsGoalUseCase } from './get-savings-goal.usecase';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { SavingsGoalProgressService } from '../services/savings-goal-progress.service';

describe('GetSavingsGoalUseCase', () => {
  let useCase: GetSavingsGoalUseCase;
  let repo: jest.Mocked<SavingsGoalsRepository>;
  let progress: jest.Mocked<SavingsGoalProgressService>;

  beforeEach(() => {
    repo = { findByYear: jest.fn() } as any;
    progress = { computeProgress: jest.fn() } as any;
    useCase = new GetSavingsGoalUseCase(repo, progress);
  });

  it('delegates progress math to SavingsGoalProgressService with the stored target', async () => {
    repo.findByYear.mockResolvedValue({ year: 2026, targetAmount: 300000000 } as any);
    progress.computeProgress.mockResolvedValue({ currentAmount: 159000000, percent: 53 });

    const result = await useCase.execute('user-1', 2026);

    expect(progress.computeProgress).toHaveBeenCalledWith('user-1', 2026, 300000000);
    expect(result).toEqual({ year: 2026, targetAmount: 300000000, currentAmount: 159000000, percent: 53 });
  });

  it('returns targetAmount 0 when no goal has been set yet for that year', async () => {
    repo.findByYear.mockResolvedValue(null);
    progress.computeProgress.mockResolvedValue({ currentAmount: 0, percent: 0 });

    const result = await useCase.execute('user-1', 2026);

    expect(progress.computeProgress).toHaveBeenCalledWith('user-1', 2026, 0);
    expect(result.targetAmount).toBe(0);
  });
});
