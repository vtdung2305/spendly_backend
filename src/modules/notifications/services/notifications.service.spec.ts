import { NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { DeviceTokensRepository } from '../repositories/device-tokens.repository';
import { ReminderSettingsRepository } from '../repositories/reminder-settings.repository';
import { FirebaseAdminService } from './firebase-admin.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationsRepo: jest.Mocked<NotificationsRepository>;
  let deviceTokensRepo: jest.Mocked<DeviceTokensRepository>;
  let reminderSettingsRepo: jest.Mocked<ReminderSettingsRepository>;
  let firebase: jest.Mocked<FirebaseAdminService>;

  const payload = { title: 'Cảnh báo ngân sách', body: 'body', icon: 'warning', tone: 'warning' as const };

  beforeEach(() => {
    notificationsRepo = { create: jest.fn() } as any;
    deviceTokensRepo = { findAllForUser: jest.fn(), deleteManyByTokens: jest.fn() } as any;
    reminderSettingsRepo = { findByUserOrDefault: jest.fn() } as any;
    firebase = { sendToTokens: jest.fn() } as any;
    service = new NotificationsService(notificationsRepo, deviceTokensRepo, reminderSettingsRepo, firebase);
  });

  it('does nothing at all when the user disabled this notification type', async () => {
    reminderSettingsRepo.findByUserOrDefault.mockResolvedValue({ budgetAlertReminder: false } as any);

    await service.notify('user-1', NotificationType.BUDGET_ALERT, payload);

    expect(notificationsRepo.create).not.toHaveBeenCalled();
    expect(deviceTokensRepo.findAllForUser).not.toHaveBeenCalled();
  });

  it('creates the in-app notification but skips push when there are no device tokens', async () => {
    reminderSettingsRepo.findByUserOrDefault.mockResolvedValue({ budgetAlertReminder: true } as any);
    deviceTokensRepo.findAllForUser.mockResolvedValue([]);

    await service.notify('user-1', NotificationType.BUDGET_ALERT, payload);

    expect(notificationsRepo.create).toHaveBeenCalledWith('user-1', { type: NotificationType.BUDGET_ALERT, ...payload });
    expect(firebase.sendToTokens).not.toHaveBeenCalled();
  });

  it('pushes to all device tokens and cleans up ones Firebase reports as invalid', async () => {
    reminderSettingsRepo.findByUserOrDefault.mockResolvedValue({ budgetAlertReminder: true } as any);
    deviceTokensRepo.findAllForUser.mockResolvedValue([{ token: 'tok-1' }, { token: 'tok-2' }] as any);
    firebase.sendToTokens.mockResolvedValue({ invalidTokens: ['tok-2'] });

    await service.notify('user-1', NotificationType.BUDGET_ALERT, payload);

    expect(firebase.sendToTokens).toHaveBeenCalledWith(['tok-1', 'tok-2'], payload.title, payload.body, {
      type: NotificationType.BUDGET_ALERT,
    });
    expect(deviceTokensRepo.deleteManyByTokens).toHaveBeenCalledWith(['tok-2']);
  });
});
