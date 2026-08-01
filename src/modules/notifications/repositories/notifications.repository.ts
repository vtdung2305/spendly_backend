import { Injectable } from '@nestjs/common';
import { Notification, NotificationType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { decodeCursor, encodeCursor } from '../../../common/pagination/cursor.util';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(userId: string, cursor: string | undefined, limit: number) {
    const where: any = { userId };
    if (cursor) {
      const { id, v } = decodeCursor(cursor);
      where.OR = [{ createdAt: { lt: new Date(v) } }, { createdAt: new Date(v), id: { lt: id } }];
    }

    const rows = await this.prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const last = data[data.length - 1];
    const nextCursor = hasMore && last ? encodeCursor({ id: last.id, sortValue: last.createdAt }) : null;

    return { data, cursor: nextCursor, hasMore };
  }

  create(
    userId: string,
    data: { type: NotificationType; title: string; body: string; icon: string; tone: string },
  ): Promise<Notification> {
    return this.prisma.notification.create({ data: { ...data, userId } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }
}
