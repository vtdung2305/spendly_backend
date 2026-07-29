import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { MailerService } from '../services/mailer.service';
import { passwordResetTemplate } from '../templates/password-reset.template';
import { emailOtpTemplate } from '../templates/email-otp.template';
import { MAIL_QUEUE, MailJob, PasswordResetJobData, EmailOtpJobData } from './mail-queue.constants';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<PasswordResetJobData | EmailOtpJobData>): Promise<void> {
    switch (job.name) {
      case MailJob.PASSWORD_RESET: {
        const data = job.data as PasswordResetJobData;
        const resetBaseUrl = this.config.get<string>('mail.resetPasswordUrl')!;
        const resetLink = `${resetBaseUrl}?token=${encodeURIComponent(data.token)}`;
        await this.mailer.send({
          to: data.email,
          subject: 'Đặt lại mật khẩu Spendly',
          html: passwordResetTemplate(data.firstName, resetLink),
        });
        return;
      }
      case MailJob.EMAIL_OTP: {
        const data = job.data as EmailOtpJobData;
        const expiryMinutes = this.config.get<number>('otp.expiryMinutes')!;
        await this.mailer.send({
          to: data.email,
          subject: 'Mã xác thực Spendly',
          html: emailOtpTemplate(data.firstName, data.code, expiryMinutes),
        });
        return;
      }
      default:
        this.logger.warn(`Unknown mail job: ${job.name}`);
    }
  }
}
