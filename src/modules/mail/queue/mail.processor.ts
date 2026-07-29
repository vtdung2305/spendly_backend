import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { MailerService } from '../services/mailer.service';
import { passwordResetTemplate } from '../templates/password-reset.template';
import { MAIL_QUEUE, MailJob, PasswordResetJobData } from './mail-queue.constants';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<PasswordResetJobData>): Promise<void> {
    switch (job.name) {
      case MailJob.PASSWORD_RESET: {
        const resetBaseUrl = this.config.get<string>('mail.resetPasswordUrl')!;
        const resetLink = `${resetBaseUrl}?token=${encodeURIComponent(job.data.token)}`;
        await this.mailer.send({
          to: job.data.email,
          subject: 'Đặt lại mật khẩu Spendly',
          html: passwordResetTemplate(job.data.firstName, resetLink),
        });
        return;
      }
      default:
        this.logger.warn(`Unknown mail job: ${job.name}`);
    }
  }
}
