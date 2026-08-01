import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { TransactionsQueryService } from '../services/transactions-query.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { ReminderSettingsQueryService } from '../../notifications/services/reminder-settings-query.service';

/**
 * Runs hourly. Every user whose reminder time matches the current hour, and
 * who hasn't logged a single transaction yet today, gets a DAILY_REMINDER
 * notification. The three time presets (08:00/12:00/20:00) all fall exactly
 * on the hour, so an hourly cron never misses or double-fires a slot.
 */
@Injectable()
export class CheckDailyRemindersUseCase {
  constructor(
    private readonly reminderSettingsQuery: ReminderSettingsQueryService,
    private readonly transactionsQuery: TransactionsQueryService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(referenceDate: Date = new Date()): Promise<{ checkedCount: number; notifiedCount: number }> {
    const hhmm = `${String(referenceDate.getHours()).padStart(2, '0')}:00`;
    const dueSettings = await this.reminderSettingsQuery.findDueForDailyReminder(hhmm);

    const startOfDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    const startOfNextDay = new Date(startOfDay);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);

    let notifiedCount = 0;
    for (const settings of dueSettings) {
      const hasLoggedToday = await this.transactionsQuery.hasAnyOnDate(settings.userId, startOfDay, startOfNextDay);
      if (hasLoggedToday) continue;

      await this.notifications.notify(settings.userId, NotificationType.DAILY_REMINDER, {
        title: 'Nhắc nhập chi tiêu',
        body: 'Hôm nay bạn chưa ghi lại khoản chi nào.',
        icon: 'edit_note',
        tone: 'primary',
      });
      notifiedCount++;
    }

    return { checkedCount: dueSettings.length, notifiedCount };
  }
}
