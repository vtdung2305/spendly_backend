import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './repositories/notifications.repository';
import { DeviceTokensRepository } from './repositories/device-tokens.repository';
import { ReminderSettingsRepository } from './repositories/reminder-settings.repository';
import { FirebaseAdminService } from './services/firebase-admin.service';
import { NotificationsService } from './services/notifications.service';
import { ReminderSettingsQueryService } from './services/reminder-settings-query.service';
import { ListNotificationsUseCase } from './usecases/list-notifications.usecase';
import { MarkAllNotificationsReadUseCase } from './usecases/mark-all-notifications-read.usecase';
import { RegisterDeviceTokenUseCase } from './usecases/register-device-token.usecase';
import { UnregisterDeviceTokenUseCase } from './usecases/unregister-device-token.usecase';
import { GetReminderSettingsUseCase } from './usecases/get-reminder-settings.usecase';
import { UpdateReminderSettingsUseCase } from './usecases/update-reminder-settings.usecase';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsRepository,
    DeviceTokensRepository,
    ReminderSettingsRepository,
    FirebaseAdminService,
    NotificationsService,
    ReminderSettingsQueryService,
    ListNotificationsUseCase,
    MarkAllNotificationsReadUseCase,
    RegisterDeviceTokenUseCase,
    UnregisterDeviceTokenUseCase,
    GetReminderSettingsUseCase,
    UpdateReminderSettingsUseCase,
  ],
  exports: [NotificationsService, ReminderSettingsQueryService],
})
export class NotificationsModule {}
