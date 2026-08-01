import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { CursorPaginationDto } from '../../../common/pagination/cursor-pagination.dto';

@Injectable()
export class ListNotificationsUseCase {
  constructor(private readonly repo: NotificationsRepository) {}

  async execute(userId: string, query: CursorPaginationDto) {
    const { data, cursor, hasMore } = await this.repo.findMany(userId, query.cursor, query.limit);
    return { data, meta: { cursor, hasMore } };
  }
}
