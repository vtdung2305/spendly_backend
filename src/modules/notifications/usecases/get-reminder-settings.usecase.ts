import { Injectable } from '@nestjs/common';
import { ReminderSettingsRepository } from '../repositories/reminder-settings.repository';

@Injectable()
export class GetReminderSettingsUseCase {
  constructor(private readonly repo: ReminderSettingsRepository) {}

  execute(userId: string) {
    return this.repo.findByUserOrDefault(userId);
  }
}
