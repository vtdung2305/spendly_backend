import { Injectable } from '@nestjs/common';
import { ReminderSettingsRepository } from '../repositories/reminder-settings.repository';
import { UpdateReminderSettingsDto } from '../dto/update-reminder-settings.dto';

@Injectable()
export class UpdateReminderSettingsUseCase {
  constructor(private readonly repo: ReminderSettingsRepository) {}

  execute(userId: string, dto: UpdateReminderSettingsDto) {
    return this.repo.upsert(userId, dto);
  }
}
