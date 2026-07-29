import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MAIL_QUEUE, MailJob, PasswordResetJobData } from './mail-queue.constants';

/**
 * Public surface other modules (Auth) depend on instead of injecting the BullMQ
 * Queue directly, so the queue name/job shape stays an implementation detail here.
 */
@Injectable()
export class MailQueueService {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly queue: Queue) {}

  async queuePasswordReset(data: PasswordResetJobData): Promise<void> {
    await this.queue.add(MailJob.PASSWORD_RESET, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 50,
    });
  }
}
