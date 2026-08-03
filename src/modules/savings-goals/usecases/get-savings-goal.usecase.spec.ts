import { GetSavingsGoalUseCase } from './get-savings-goal.usecase';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { SavingsGoalProgressService } from '../services/savings-goal-progress.service';

describe('GetSavingsGoalUseCase', () => {
  let useCase: GetSavingsGoalUseCase;
  let repo: jest.Mocked<SavingsGoalsRepository>;
  let progress: jest.Mocked<SavingsGoalProgressService>;

  beforeEach(() => {
    repo = { findAllForUser: jest.fn() } as any;
    progress = { computeProgress: jest.fn() } as any;
    useCase = new GetSavingsGoalUseCase(repo, progress);
  });

  it('returns a zero-value default when the user has no goals', async () => {
    repo.findAllForUser.mockResolvedValue([]);

    const result = await useCase.execute('user-1');

    expect(progress.computeProgress).not.toHaveBeenCalled();
    expect(result).toEqual({ id: null, name: null, targetAmount: 0, currentAmount: 0, percent: 0, deadline: null });
  });

  it('picks the goal with the nearest upcoming deadline', async () => {
    const soon = { id: 'soon', name: 'Soon', targetAmount: 100, initialAmount: 0, createdAt: new Date('2026-01-01'), deadline: futureDate(10) } as any;
    const later = { id: 'later', name: 'Later', targetAmount: 200, initialAmount: 0, createdAt: new Date('2026-01-01'), deadline: futureDate(100) } as any;
    repo.findAllForUser.mockResolvedValue([later, soon]);
    progress.computeProgress.mockResolvedValue({ currentAmount: 50, percent: 50 });

    const result = await useCase.execute('user-1');

    expect(progress.computeProgress).toHaveBeenCalledWith('user-1', soon.createdAt, soon.deadline, 100, 0);
    expect(result).toEqual({ id: 'soon', name: 'Soon', targetAmount: 100, currentAmount: 50, percent: 50, deadline: soon.deadline });
  });

  it('falls back to the most recent past deadline when every goal is already due', async () => {
    const older = { id: 'older', name: 'Older', targetAmount: 100, initialAmount: 0, createdAt: new Date('2020-01-01'), deadline: new Date('2021-01-01') } as any;
    const recent = { id: 'recent', name: 'Recent', targetAmount: 200, initialAmount: 0, createdAt: new Date('2023-01-01'), deadline: new Date('2024-01-01') } as any;
    repo.findAllForUser.mockResolvedValue([older, recent]);
    progress.computeProgress.mockResolvedValue({ currentAmount: 200, percent: 100 });

    const result = await useCase.execute('user-1');

    expect(progress.computeProgress).toHaveBeenCalledWith('user-1', recent.createdAt, recent.deadline, 200, 0);
    expect(result.id).toBe('recent');
  });
});

function futureDate(daysFromNow: number): Date {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
}
