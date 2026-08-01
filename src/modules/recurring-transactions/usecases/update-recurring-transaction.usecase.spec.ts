import { NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { UpdateRecurringTransactionUseCase } from './update-recurring-transaction.usecase';
import { RecurringTransactionsRepository } from '../repositories/recurring-transactions.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('UpdateRecurringTransactionUseCase', () => {
  let useCase: UpdateRecurringTransactionUseCase;
  let repo: jest.Mocked<RecurringTransactionsRepository>;
  let prisma: { category: { findFirst: jest.Mock } };

  beforeEach(() => {
    repo = { findByIdForUser: jest.fn(), update: jest.fn() } as any;
    prisma = { category: { findFirst: jest.fn() } };
    useCase = new UpdateRecurringTransactionUseCase(repo, prisma as unknown as PrismaService);
  });

  it('throws NotFoundException when the recurring transaction does not belong to the user', async () => {
    repo.findByIdForUser.mockResolvedValue(null);

    await expect(useCase.execute('rec-1', 'user-1', { amount: 100 })).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('validates the new category against the existing type when only categoryId changes', async () => {
    repo.findByIdForUser.mockResolvedValue({ id: 'rec-1', type: TransactionType.EXPENSE } as any);
    prisma.category.findFirst.mockResolvedValue({ id: 'cat-2' });
    repo.update.mockResolvedValue({ id: 'rec-1' } as any);

    await useCase.execute('rec-1', 'user-1', { categoryId: 'cat-2' });

    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { id: 'cat-2', userId: 'user-1', type: TransactionType.EXPENSE, deletedAt: null },
    });
  });

  it('validates the new category against the new type when both change together', async () => {
    repo.findByIdForUser.mockResolvedValue({ id: 'rec-1', type: TransactionType.EXPENSE } as any);
    prisma.category.findFirst.mockResolvedValue({ id: 'cat-income' });
    repo.update.mockResolvedValue({ id: 'rec-1' } as any);

    await useCase.execute('rec-1', 'user-1', { type: TransactionType.INCOME, categoryId: 'cat-income' });

    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { id: 'cat-income', userId: 'user-1', type: TransactionType.INCOME, deletedAt: null },
    });
  });

  it('throws NotFoundException when the new category does not match the type', async () => {
    repo.findByIdForUser.mockResolvedValue({ id: 'rec-1', type: TransactionType.EXPENSE } as any);
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(useCase.execute('rec-1', 'user-1', { categoryId: 'wrong-cat' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('updates only the provided fields (e.g. pausing via isActive)', async () => {
    repo.findByIdForUser.mockResolvedValue({ id: 'rec-1', type: TransactionType.EXPENSE } as any);
    repo.update.mockResolvedValue({ id: 'rec-1', isActive: false } as any);

    const result = await useCase.execute('rec-1', 'user-1', { isActive: false });

    expect(repo.update).toHaveBeenCalledWith('rec-1', { isActive: false });
    expect(result).toEqual({ id: 'rec-1', isActive: false });
  });
});
