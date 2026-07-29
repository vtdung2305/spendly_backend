import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt, createHash } from 'crypto';
import { AuthRepository } from '../repositories/auth.repository';
import { MailQueueService } from '../../mail/queue/mail-queue.service';

@Injectable()
export class EmailOtpService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly mailQueue: MailQueueService,
    private readonly config: ConfigService,
  ) {}

  hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  /** Generates a fresh 6-digit code, invalidating any previously issued one, and emails it. */
  async issue(userId: string, email: string, firstName: string): Promise<void> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiryMinutes = this.config.get<number>('otp.expiryMinutes')!;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60_000);

    await this.authRepo.createEmailOtp(userId, this.hash(code), expiresAt);
    await this.mailQueue.queueEmailOtp({ email, firstName, code });
  }
}
