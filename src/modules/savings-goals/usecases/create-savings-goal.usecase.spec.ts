import { CreateSavingsGoalUseCase } from './create-savings-goal.usecase';
import { SavingsGoalsRepository } from '../repositories/savings-goals.repository';

describe('CreateSavingsGoalUseCase', () => {
  let useCase: CreateSavingsGoalUseCase;
  let repo: jest.Mocked<SavingsGoalsRepository>;

  beforeEach(() => {
    repo = { create: jest.fn() } as any;
    useCase = new CreateSavingsGoalUseCase(repo);
  });

  it('creates a goal with the given name, target, deadline and initial amount', async () => {
    repo.create.mockResolvedValue({ id: 'new-goal' } as any);

    const result = await useCase.execute('user-1', {
      name: 'Mục tiêu tiết kiệm 2026',
      targetAmount: 500000000,
      deadline: '2026-12-31',
      initialAmount: 1000000,
    });

    expect(repo.create).toHaveBeenCalledWith('user-1', {
      name: 'Mục tiêu tiết kiệm 2026',
      targetAmount: 500000000,
      deadline: new Date('2026-12-31'),
      initialAmount: 1000000,
    });
    expect(result).toEqual({ id: 'new-goal' });
  });

  it('allows multiple goals to be created (no year uniqueness constraint)', async () => {
    repo.create.mockResolvedValue({ id: 'goal-2' } as any);

    await useCase.execute('user-1', { name: 'Xe máy mới', targetAmount: 50000000, deadline: '2027-06-30' });

    expect(repo.create).toHaveBeenCalledWith('user-1', {
      name: 'Xe máy mới',
      targetAmount: 50000000,
      deadline: new Date('2027-06-30'),
      initialAmount: undefined,
    });
  });
});
