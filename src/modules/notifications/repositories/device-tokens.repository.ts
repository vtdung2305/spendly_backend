import { Injectable } from '@nestjs/common';
import { DeviceToken } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DeviceTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string): Promise<DeviceToken[]> {
    return this.prisma.deviceToken.findMany({ where: { userId } });
  }

  /** A token can be re-registered by the same or a different user (device changed hands / reinstall). */
  upsert(userId: string, token: string, platform?: string): Promise<DeviceToken> {
    return this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  }

  deleteByToken(token: string): Promise<void> {
    return this.prisma.deviceToken
      .delete({ where: { token } })
      .then(() => undefined)
      .catch(() => undefined); // already gone — fine
  }

  deleteManyByTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return Promise.resolve();
    return this.prisma.deviceToken.deleteMany({ where: { token: { in: tokens } } }).then(() => undefined);
  }
}
