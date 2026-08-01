import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RECURRING_TRANSACTIONS_QUEUE, GENERATE_JOB_NAME, GENERATE_JOB_ID, GENERATE_JOB_CRON } from './recurring-transactions-queue.constants';

/**
 * Registers the daily repeatable job on bootstrap. BullMQ dedupes repeatable
 * jobs by (name, repeat pattern, jobId), so re-registering on every app start
 * is a no-op once it already exists — safe to call every boot.
 */
@Injectable()
export class RecurringTransactionsSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(RecurringTransactionsSchedulerService.name);

  constructor(@InjectQueue(RECURRING_TRANSACTIONS_QUEUE) private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.add(
      GENERATE_JOB_NAME,
      {},
      {
        jobId: GENERATE_JOB_ID,
        repeat: { pattern: GENERATE_JOB_CRON },
        removeOnComplete: true,
        removeOnFail: 20,
      },
    );
    this.logger.log(`Scheduled "${GENERATE_JOB_NAME}" with cron "${GENERATE_JOB_CRON}"`);
  }
}
