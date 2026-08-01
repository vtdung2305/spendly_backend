import { Injectable } from '@nestjs/common';
import { ReminderSettingsRepository } from '../repositories/reminder-settings.repository';

/**
 * Read-only surface for other modules (Transactions' daily-reminder job) —
 * avoids importing ReminderSettingsRepository directly.
 */
@Injectable()
export class ReminderSettingsQueryService {
  constructor(private readonly repo: ReminderSettingsRepository) {}

  findDueForDailyReminder(hhmm: string) {
    return this.repo.findDueForDailyReminder(hhmm);
  }
}
