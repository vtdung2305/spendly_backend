import { Injectable } from '@nestjs/common';
import { AuthProvider, User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DEFAULT_CATEGORIES } from '../../categories/constants/default-categories.constant';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  findUserByProvider(provider: AuthProvider, providerId: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { provider, providerId, deletedAt: null } });
  }

  async createUser(data: {
    email: string;
    passwordHash?: string | null;
    provider: AuthProvider;
    providerId?: string | null;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  }): Promise<User> {
    // OAuth providers already verify the email themselves; only EMAIL/password
    // registrations go through the OTP flow.
    const emailVerifiedAt = data.provider === AuthProvider.EMAIL ? null : new Date();

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { ...data, emailVerifiedAt } });
      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id })),
      });
      return user;
    });
  }

  markEmailVerified(userId: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  }

  updateUserPassword(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  findRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({ where: { tokenHash } });
  }

  markRefreshTokenUsed(id: string) {
    return this.prisma.refreshToken.update({ where: { id }, data: { usedAt: new Date() } });
  }

  revokeAllRefreshTokensForUser(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  findValidPasswordResetToken(tokenHash: string) {
    return this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  markPasswordResetTokenUsed(id: string) {
    return this.prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  }

  async createEmailOtp(userId: string, codeHash: string, expiresAt: Date) {
    // Only the most recently issued OTP should ever be valid.
    await this.prisma.emailOtp.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
    return this.prisma.emailOtp.create({ data: { userId, codeHash, expiresAt } });
  }

  findLatestActiveEmailOtp(userId: string) {
    return this.prisma.emailOtp.findFirst({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  incrementEmailOtpAttempts(id: string, attempts: number) {
    return this.prisma.emailOtp.update({ where: { id }, data: { attempts } });
  }

  markEmailOtpUsed(id: string) {
    return this.prisma.emailOtp.update({ where: { id }, data: { usedAt: new Date() } });
  }
}
