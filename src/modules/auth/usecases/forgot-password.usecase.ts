import { Injectable } from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import { AuthRepository } from '../repositories/auth.repository';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { MailQueueService } from '../../mail/queue/mail-queue.service';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly mailQueue: MailQueueService,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.authRepo.findUserByEmail(dto.email);
    // Always resolve silently even if the email doesn't exist, to avoid leaking
    // which emails are registered.
    if (!user) return;

    const token = randomUUID();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await this.authRepo.createPasswordResetToken(user.id, tokenHash, expiresAt);

    await this.mailQueue.queuePasswordReset({ email: user.email, firstName: user.firstName, token });
  }
}
