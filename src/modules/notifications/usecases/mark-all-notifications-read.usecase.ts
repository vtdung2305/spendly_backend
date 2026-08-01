import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';

@Injectable()
export class MarkAllNotificationsReadUseCase {
  constructor(private readonly repo: NotificationsRepository) {}

  async execute(userId: string): Promise<void> {
    await this.repo.markAllRead(userId);
  }
}
