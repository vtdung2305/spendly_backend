import { TransactionType, NotificationType } from '@prisma/client';
import { GenerateRecurringTransactionsUseCase } from './generate-recurring-transactions.usecase';
import { RecurringTransactionsRepository } from '../repositories/recurring-transactions.repository';
import { CreateTransactionUseCase } from '../../transactions/usecases/create-transaction.usecase';
import { NotificationsService } from '../../notifications/services/notifications.service';

describe('GenerateRecurringTransactionsUseCase', () => {
  let useCase: GenerateRecurringTransactionsUseCase;
  let repo: jest.Mocked<RecurringTransactionsRepository>;
  let createTransaction: jest.Mocked<CreateTransactionUseCase>;
  let notifications: jest.Mocked<NotificationsService>;

  beforeEach(() => {
    repo = { findDueForGeneration: jest.fn(), markGenerated: jest.fn() } as any;
    createTransaction = { execute: jest.fn() } as any;
    notifications = { notify: jest.fn() } as any;
    useCase = new GenerateRecurringTransactionsUseCase(repo, createTransaction, notifications);
  });

  it('queries using the reference date\'s day-of-month and YYYY-MM key', async () => {
    repo.findDueForGeneration.mockResolvedValue([]);

    await useCase.execute(new Date(2026, 6, 1)); // July 1, 2026

    expect(repo.findDueForGeneration).toHaveBeenCalledWith(1, '2026-07');
  });

  it('creates a transaction for each due recurring item, stamps lastGeneratedMonth, and notifies', async () => {
    repo.findDueForGeneration.mockResolvedValue([
      { id: 'rec-1', userId: 'user-1', type: TransactionType.EXPENSE, categoryId: 'cat-1', amount: 6000000, label: 'Tiền nhà' },
      { id: 'rec-2', userId: 'user-2', type: TransactionType.INCOME, categoryId: 'cat-2', amount: 45000000, label: 'Lương' },
    ] as any);
    createTransaction.execute.mockResolvedValue({} as any);

    const result = await useCase.execute(new Date(2026, 6, 1));

    expect(createTransaction.execute).toHaveBeenCalledWith('user-1', {
      type: TransactionType.EXPENSE,
      categoryId: 'cat-1',
      amount: 6000000,
      note: 'Tiền nhà',
      occurredAt: '2026-07-01',
    });
    expect(createTransaction.execute).toHaveBeenCalledWith('user-2', {
      type: TransactionType.INCOME,
      categoryId: 'cat-2',
      amount: 45000000,
      note: 'Lương',
      occurredAt: '2026-07-01',
    });
    expect(repo.markGenerated).toHaveBeenCalledWith('rec-1', '2026-07');
    expect(repo.markGenerated).toHaveBeenCalledWith('rec-2', '2026-07');
    expect(notifications.notify).toHaveBeenCalledWith(
      'user-1',
      NotificationType.RECURRING_GENERATED,
      expect.objectContaining({ title: 'Giao dịch định kỳ', body: expect.stringContaining('Tiền nhà') }),
    );
    expect(result).toEqual({ generatedCount: 2, dueCount: 2 });
  });

  it('continues past a failure on one item instead of aborting the whole batch, and skips its notification', async () => {
    repo.findDueForGeneration.mockResolvedValue([
      { id: 'rec-bad', userId: 'user-1', type: TransactionType.EXPENSE, categoryId: 'deleted-cat', amount: 1, label: 'Bad' },
      { id: 'rec-good', userId: 'user-1', type: TransactionType.EXPENSE, categoryId: 'cat-1', amount: 2, label: 'Good' },
    ] as any);
    createTransaction.execute
      .mockRejectedValueOnce(new Error('Category not found'))
      .mockResolvedValueOnce({} as any);

    const result = await useCase.execute(new Date(2026, 6, 1));

    expect(repo.markGenerated).not.toHaveBeenCalledWith('rec-bad', expect.anything());
    expect(repo.markGenerated).toHaveBeenCalledWith('rec-good', '2026-07');
    expect(notifications.notify).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ generatedCount: 1, dueCount: 2 });
  });

  it('returns zero counts when nothing is due', async () => {
    repo.findDueForGeneration.mockResolvedValue([]);

    const result = await useCase.execute(new Date(2026, 6, 15));

    expect(result).toEqual({ generatedCount: 0, dueCount: 0 });
    expect(createTransaction.execute).not.toHaveBeenCalled();
    expect(notifications.notify).not.toHaveBeenCalled();
  });
});
