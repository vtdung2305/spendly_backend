import { NotificationType } from '@prisma/client';
import { CheckBudgetAlertUseCase } from './check-budget-alert.usecase';
import { BudgetsQueryService } from '../../budgets/services/budgets-query.service';
import { NotificationsService } from '../../notifications/services/notifications.service';

describe('CheckBudgetAlertUseCase', () => {
  let useCase: CheckBudgetAlertUseCase;
  let budgetsQuery: jest.Mocked<BudgetsQueryService>;
  let notifications: jest.Mocked<NotificationsService>;

  beforeEach(() => {
    budgetsQuery = { getStatus: jest.fn() } as any;
    notifications = { notify: jest.fn() } as any;
    useCase = new CheckBudgetAlertUseCase(budgetsQuery, notifications);
  });

  it('does nothing when the category has no budget set', async () => {
    budgetsQuery.getStatus.mockResolvedValue(null);

    await useCase.execute({
      userId: 'user-1',
      categoryId: 'cat-1',
      categoryName: 'Ăn uống',
      occurredAt: new Date(2026, 6, 15),
      transactionAmount: 100000,
    });

    expect(notifications.notify).not.toHaveBeenCalled();
  });

  it('fires the alert when this transaction crosses the category from under 80% to 80%+', async () => {
    // limit 1,000,000; spent (incl. this txn) 850,000 => 85%; before this txn: 750,000 => 75%
    budgetsQuery.getStatus.mockResolvedValue({ limitAmount: 1000000, spentAmount: 850000, usedPercent: 85 });

    await useCase.execute({
      userId: 'user-1',
      categoryId: 'cat-1',
      categoryName: 'Ăn uống',
      occurredAt: new Date(2026, 6, 15),
      transactionAmount: 100000,
    });

    expect(notifications.notify).toHaveBeenCalledWith(
      'user-1',
      NotificationType.BUDGET_ALERT,
      expect.objectContaining({ body: expect.stringContaining('85% ngân sách Ăn uống') }),
    );
  });

  it('does not re-fire when the category was already over 80% before this transaction', async () => {
    // before: 900,000/1,000,000 = 90%; after: 950,000 = 95% — already over, shouldn't refire
    budgetsQuery.getStatus.mockResolvedValue({ limitAmount: 1000000, spentAmount: 950000, usedPercent: 95 });

    await useCase.execute({
      userId: 'user-1',
      categoryId: 'cat-1',
      categoryName: 'Ăn uống',
      occurredAt: new Date(2026, 6, 15),
      transactionAmount: 50000,
    });

    expect(notifications.notify).not.toHaveBeenCalled();
  });

  it('does not fire when still under 80% after this transaction', async () => {
    budgetsQuery.getStatus.mockResolvedValue({ limitAmount: 1000000, spentAmount: 500000, usedPercent: 50 });

    await useCase.execute({
      userId: 'user-1',
      categoryId: 'cat-1',
      categoryName: 'Ăn uống',
      occurredAt: new Date(2026, 6, 15),
      transactionAmount: 100000,
    });

    expect(notifications.notify).not.toHaveBeenCalled();
  });

  it('swallows errors so a notification failure never breaks transaction creation', async () => {
    budgetsQuery.getStatus.mockRejectedValue(new Error('db down'));

    await expect(
      useCase.execute({
        userId: 'user-1',
        categoryId: 'cat-1',
        categoryName: 'Ăn uống',
        occurredAt: new Date(2026, 6, 15),
        transactionAmount: 100000,
      }),
    ).resolves.toBeUndefined();
  });
});
