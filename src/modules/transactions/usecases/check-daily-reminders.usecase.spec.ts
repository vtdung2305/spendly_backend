import { NotificationType } from '@prisma/client';
import { CheckDailyRemindersUseCase } from './check-daily-reminders.usecase';
import { ReminderSettingsQueryService } from '../../notifications/services/reminder-settings-query.service';
import { TransactionsQueryService } from '../services/transactions-query.service';
import { NotificationsService } from '../../notifications/services/notifications.service';

describe('CheckDailyRemindersUseCase', () => {
  let useCase: CheckDailyRemindersUseCase;
  let reminderSettingsQuery: jest.Mocked<ReminderSettingsQueryService>;
  let transactionsQuery: jest.Mocked<TransactionsQueryService>;
  let notifications: jest.Mocked<NotificationsService>;

  beforeEach(() => {
    reminderSettingsQuery = { findDueForDailyReminder: jest.fn() } as any;
    transactionsQuery = { hasAnyOnDate: jest.fn() } as any;
    notifications = { notify: jest.fn() } as any;
    useCase = new CheckDailyRemindersUseCase(reminderSettingsQuery, transactionsQuery, notifications);
  });

  it('queries using the current hour formatted as HH:00', async () => {
    reminderSettingsQuery.findDueForDailyReminder.mockResolvedValue([]);

    await useCase.execute(new Date(2026, 6, 15, 20, 7));

    expect(reminderSettingsQuery.findDueForDailyReminder).toHaveBeenCalledWith('20:00');
  });

  it('notifies users due this hour who have not logged anything today', async () => {
    reminderSettingsQuery.findDueForDailyReminder.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }] as any);
    transactionsQuery.hasAnyOnDate.mockImplementation(async (userId) => userId === 'user-2');

    const result = await useCase.execute(new Date(2026, 6, 15, 20, 0));

    expect(notifications.notify).toHaveBeenCalledTimes(1);
    expect(notifications.notify).toHaveBeenCalledWith(
      'user-1',
      NotificationType.DAILY_REMINDER,
      expect.objectContaining({ title: 'Nhắc nhập chi tiêu' }),
    );
    expect(result).toEqual({ checkedCount: 2, notifiedCount: 1 });
  });

  it('checks hasAnyOnDate against today\'s local calendar day, not UTC', async () => {
    reminderSettingsQuery.findDueForDailyReminder.mockResolvedValue([{ userId: 'user-1' }] as any);
    transactionsQuery.hasAnyOnDate.mockResolvedValue(true);

    await useCase.execute(new Date(2026, 6, 15, 20, 0));

    expect(transactionsQuery.hasAnyOnDate).toHaveBeenCalledWith(
      'user-1',
      new Date(2026, 6, 15),
      new Date(2026, 6, 16),
    );
  });

  it('returns zero counts when no one is due this hour', async () => {
    reminderSettingsQuery.findDueForDailyReminder.mockResolvedValue([]);

    const result = await useCase.execute(new Date(2026, 6, 15, 9, 0));

    expect(result).toEqual({ checkedCount: 0, notifiedCount: 0 });
    expect(notifications.notify).not.toHaveBeenCalled();
  });
});
