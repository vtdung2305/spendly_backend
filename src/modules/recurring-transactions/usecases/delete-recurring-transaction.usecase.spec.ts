import { NotFoundException } from '@nestjs/common';
import { DeleteRecurringTransactionUseCase } from './delete-recurring-transaction.usecase';
import { RecurringTransactionsRepository } from '../repositories/recurring-transactions.repository';

describe('DeleteRecurringTransactionUseCase', () => {
  let useCase: DeleteRecurringTransactionUseCase;
  let repo: jest.Mocked<RecurringTransactionsRepository>;

  beforeEach(() => {
    repo = { findByIdForUser: jest.fn(), softDelete: jest.fn() } as any;
    useCase = new DeleteRecurringTransactionUseCase(repo);
  });

  it('throws NotFoundException when the recurring transaction does not belong to the user', async () => {
    repo.findByIdForUser.mockResolvedValue(null);

    await expect(useCase.execute('rec-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('soft-deletes the recurring transaction', async () => {
    repo.findByIdForUser.mockResolvedValue({ id: 'rec-1' } as any);

    await useCase.execute('rec-1', 'user-1');

    expect(repo.softDelete).toHaveBeenCalledWith('rec-1');
  });
});
