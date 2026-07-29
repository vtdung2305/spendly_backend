import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { User } from '@prisma/client';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  signAccessToken(user: Pick<User, 'id' | 'email'>): string {
    return this.jwt.sign(
      { sub: user.id, email: user.email },
      {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get<string>('jwt.accessExpiry'),
      },
    );
  }

  generateRefreshToken(): { token: string; hash: string; expiresAt: Date } {
    const token = randomUUID() + randomUUID();
    const hash = this.hashToken(token);
    const expiresAt = this.expiryFromNow(this.config.get<string>('jwt.refreshExpiry') ?? '7d');
    return { token, hash, expiresAt };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private expiryFromNow(duration: string): Date {
    const match = /^(\d+)([smhd])$/.exec(duration);
    const amount = match ? parseInt(match[1], 10) : 7;
    const unit = match ? match[2] : 'd';
    const multiplier = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 86_400_000;
    return new Date(Date.now() + amount * multiplier);
  }
}
