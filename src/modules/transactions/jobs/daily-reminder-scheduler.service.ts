import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DAILY_REMINDER_QUEUE, CHECK_JOB_NAME, CHECK_JOB_ID, CHECK_JOB_CRON } from './daily-reminder-queue.constants';

@Injectable()
export class DailyReminderSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(DailyReminderSchedulerService.name);

  constructor(@InjectQueue(DAILY_REMINDER_QUEUE) private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.add(
      CHECK_JOB_NAME,
      {},
      {
        jobId: CHECK_JOB_ID,
        repeat: { pattern: CHECK_JOB_CRON },
        removeOnComplete: true,
        removeOnFail: 20,
      },
    );
    this.logger.log(`Scheduled "${CHECK_JOB_NAME}" with cron "${CHECK_JOB_CRON}"`);
  }
}
