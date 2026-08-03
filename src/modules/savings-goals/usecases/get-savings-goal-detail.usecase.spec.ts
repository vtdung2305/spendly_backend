import { NotFoundException } from '@nestjs/common';
import { GetSavingsGoalDetailUseCase } from './get-savings-goal-detail.usecase';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';
import { SavingsGoalProgressService } from '../services/savings-goal-progress.service';

describe('GetSavingsGoalDetailUseCase', () => {
  let useCase: GetSavingsGoalDetailUseCase;
  let repo: jest.Mocked<SavingsGoalsRepository>;
  let progress: jest.Mocked<SavingsGoalProgressService>;

  beforeEach(() => {
    repo = { findByIdForUser: jest.fn() } as any;
    progress = { computeProgress: jest.fn(), computeHistory: jest.fn() } as any;
    useCase = new GetSavingsGoalDetailUseCase(repo, progress);
  });

  it('throws NotFoundException when no goal exists with that id for this user', async () => {
    repo.findByIdForUser.mockResolvedValue(null);

    await expect(useCase.execute('user-1', 'goal-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(progress.computeProgress).not.toHaveBeenCalled();
  });

  it('combines progress and history into a single detail payload', async () => {
    const createdAt = new Date('2026-01-01');
    const deadline = new Date('2026-12-31');
    repo.findByIdForUser.mockResolvedValue({
      id: 'goal-1',
      name: 'Mục tiêu tiết kiệm 2026',
      targetAmount: 300000000,
      initialAmount: 1000000,
      createdAt,
      deadline,
    } as any);
    progress.computeProgress.mockResolvedValue({ currentAmount: 159000000, percent: 53 });
    progress.computeHistory.mockResolvedValue({
      deadline: '2026-12-31',
      avgPerMonth: 23916667,
      contributionCount: 6,
      history: [{ label: 'Đóng góp tháng 6', date: '2026-06-30', amount: 26500000 }],
    });

    const result = await useCase.execute('user-1', 'goal-1');

    expect(progress.computeProgress).toHaveBeenCalledWith('user-1', createdAt, deadline, 300000000, 1000000);
    expect(progress.computeHistory).toHaveBeenCalledWith('user-1', createdAt, deadline);
    expect(result).toEqual({
      id: 'goal-1',
      name: 'Mục tiêu tiết kiệm 2026',
      targetAmount: 300000000,
      initialAmount: 1000000,
      currentAmount: 159000000,
      percent: 53,
      deadline: '2026-12-31',
      avgPerMonth: 23916667,
      contributionCount: 6,
      history: [{ label: 'Đóng góp tháng 6', date: '2026-06-30', amount: 26500000 }],
    });
  });
});
