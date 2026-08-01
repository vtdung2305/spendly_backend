import { NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { CreateRecurringTransactionUseCase } from './create-recurring-transaction.usecase';
import { RecurringTransactionsRepository } from '../repositories/recurring-transactions.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('CreateRecurringTransactionUseCase', () => {
  let useCase: CreateRecurringTransactionUseCase;
  let repo: jest.Mocked<RecurringTransactionsRepository>;
  let prisma: { category: { findFirst: jest.Mock } };

  beforeEach(() => {
    repo = { create: jest.fn() } as any;
    prisma = { category: { findFirst: jest.fn() } };
    useCase = new CreateRecurringTransactionUseCase(repo, prisma as unknown as PrismaService);
  });

  it('throws NotFoundException when the category does not belong to the user or type mismatches', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', {
        type: TransactionType.EXPENSE,
        categoryId: 'cat-1',
        label: 'Tiền nhà',
        amount: 6000000,
        dayOfMonth: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates the recurring transaction with isActive defaulting to true', async () => {
    prisma.category.findFirst.mockResolvedValue({ id: 'cat-1' });
    repo.create.mockResolvedValue({ id: 'rec-1' } as any);

    const result = await useCase.execute('user-1', {
      type: TransactionType.EXPENSE,
      categoryId: 'cat-1',
      label: 'Tiền nhà',
      amount: 6000000,
      dayOfMonth: 1,
    });

    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { id: 'cat-1', userId: 'user-1', type: TransactionType.EXPENSE, deletedAt: null },
    });
    expect(repo.create).toHaveBeenCalledWith('user-1', {
      type: TransactionType.EXPENSE,
      categoryId: 'cat-1',
      label: 'Tiền nhà',
      amount: 6000000,
      dayOfMonth: 1,
      isActive: true,
    });
    expect(result).toEqual({ id: 'rec-1' });
  });

  it('respects an explicit isActive:false', async () => {
    prisma.category.findFirst.mockResolvedValue({ id: 'cat-1' });
    repo.create.mockResolvedValue({ id: 'rec-1' } as any);

    await useCase.execute('user-1', {
      type: TransactionType.EXPENSE,
      categoryId: 'cat-1',
      label: 'Gói gym',
      amount: 500000,
      dayOfMonth: 10,
      isActive: false,
    });

    expect(repo.create).toHaveBeenCalledWith('user-1', expect.objectContaining({ isActive: false }));
  });
});
