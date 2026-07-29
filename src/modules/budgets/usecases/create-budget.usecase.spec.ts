import { NotFoundException } from '@nestjs/common';
import { CreateBudgetUseCase } from './create-budget.usecase';
import { BudgetsRepository } from '../repositories/budgets.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('CreateBudgetUseCase', () => {
  let useCase: CreateBudgetUseCase;
  let repo: jest.Mocked<BudgetsRepository>;
  let prisma: { category: { findFirst: jest.Mock } };

  beforeEach(() => {
    repo = {
      findByCategoryAndMonth: jest.fn(),
      create: jest.fn(),
    } as any;
    prisma = { category: { findFirst: jest.fn() } };

    useCase = new CreateBudgetUseCase(repo, prisma as unknown as PrismaService);
  });

  it('throws NotFoundException when the category does not belong to the user (or is INCOME type)', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', { categoryId: 'cat-1', month: '2026-07', limitAmount: 1000000 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BUDGET_ALREADY_EXISTS when a budget already exists for that category/month', async () => {
    prisma.category.findFirst.mockResolvedValue({ id: 'cat-1' });
    repo.findByCategoryAndMonth.mockResolvedValue({ id: 'existing-budget' } as any);

    await expect(
      useCase.execute('user-1', { categoryId: 'cat-1', month: '2026-07', limitAmount: 1000000 }),
    ).rejects.toMatchObject({ code: 'BUDGET_ALREADY_EXISTS' });
  });

  it('creates the budget when the category is valid and no budget exists yet', async () => {
    prisma.category.findFirst.mockResolvedValue({ id: 'cat-1' });
    repo.findByCategoryAndMonth.mockResolvedValue(null);
    repo.create.mockResolvedValue({ id: 'new-budget' } as any);

    const result = await useCase.execute('user-1', { categoryId: 'cat-1', month: '2026-07', limitAmount: 1000000 });

    expect(repo.create).toHaveBeenCalledWith('user-1', 'cat-1', '2026-07', 1000000);
    expect(result).toEqual({ id: 'new-budget' });
  });
});
