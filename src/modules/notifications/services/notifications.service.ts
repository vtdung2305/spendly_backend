import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { DeviceTokensRepository } from '../repositories/device-tokens.repository';
import { ReminderSettingsRepository } from '../repositories/reminder-settings.repository';
import { FirebaseAdminService } from './firebase-admin.service';

export interface NotifyPayload {
  title: string;
  body: string;
  icon: string;
  tone: 'warning' | 'primary' | 'success';
}

const SETTINGS_KEY_BY_TYPE: Record<NotificationType, 'dailyExpenseReminder' | 'budgetAlertReminder' | 'recurringAlertReminder'> = {
  DAILY_REMINDER: 'dailyExpenseReminder',
  BUDGET_ALERT: 'budgetAlertReminder',
  RECURRING_GENERATED: 'recurringAlertReminder',
};

/**
 * Exported facade other modules (Transactions, RecurringTransactions) call to
 * raise a notification — they don't need to know about ReminderSettings gating,
 * DB persistence, or FCM at all.
 */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepo: NotificationsRepository,
    private readonly deviceTokensRepo: DeviceTokensRepository,
    private readonly reminderSettingsRepo: ReminderSettingsRepository,
    private readonly firebase: FirebaseAdminService,
  ) {}

  async notify(userId: string, type: NotificationType, payload: NotifyPayload): Promise<void> {
    const settings = await this.reminderSettingsRepo.findByUserOrDefault(userId);
    if (!settings[SETTINGS_KEY_BY_TYPE[type]]) return;

    await this.notificationsRepo.create(userId, { type, ...payload });

    const tokens = await this.deviceTokensRepo.findAllForUser(userId);
    if (tokens.length === 0) return;

    const { invalidTokens } = await this.firebase.sendToTokens(
      tokens.map((t) => t.token),
      payload.title,
      payload.body,
      { type },
    );
    await this.deviceTokensRepo.deleteManyByTokens(invalidTokens);
  }
}
