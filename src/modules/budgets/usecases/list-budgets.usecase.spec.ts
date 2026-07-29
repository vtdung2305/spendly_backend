import { ListBudgetsUseCase } from './list-budgets.usecase';
import { BudgetsRepository } from '../repositories/budgets.repository';

describe('ListBudgetsUseCase', () => {
  let useCase: ListBudgetsUseCase;
  let repo: jest.Mocked<BudgetsRepository>;

  beforeEach(() => {
    repo = {
      findByMonth: jest.fn(),
      spentByCategoryForMonth: jest.fn(),
    } as any;

    useCase = new ListBudgetsUseCase(repo);
  });

  it('computes usedPercent and flags isOverBudget when spend exceeds the limit', async () => {
    repo.findByMonth.mockResolvedValue([
      {
        id: 'b1',
        month: '2026-07',
        categoryId: 'cat-1',
        limitAmount: 1000000,
        category: { id: 'cat-1', name: 'Giải trí', color: '#F43F5E', icon: 'sports_esports' },
      },
    ] as any);
    repo.spentByCategoryForMonth.mockResolvedValue(new Map([['cat-1', 1120000]]));

    const [budget] = await useCase.execute('user-1', '2026-07');

    expect(budget.spentAmount).toBe(1120000);
    expect(budget.usedPercent).toBe(112);
    expect(budget.isOverBudget).toBe(true);
  });

  it('reports 0% used and no spend when the category had no transactions this month', async () => {
    repo.findByMonth.mockResolvedValue([
      {
        id: 'b2',
        month: '2026-07',
        categoryId: 'cat-2',
        limitAmount: 500000,
        category: { id: 'cat-2', name: 'Du lịch', color: '#F59E0B', icon: 'flight' },
      },
    ] as any);
    repo.spentByCategoryForMonth.mockResolvedValue(new Map());

    const [budget] = await useCase.execute('user-1', '2026-07');

    expect(budget.spentAmount).toBe(0);
    expect(budget.usedPercent).toBe(0);
    expect(budget.isOverBudget).toBe(false);
  });
});
