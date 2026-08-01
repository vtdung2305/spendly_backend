import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CheckDailyRemindersUseCase } from '../usecases/check-daily-reminders.usecase';
import { DAILY_REMINDER_QUEUE } from './daily-reminder-queue.constants';

@Processor(DAILY_REMINDER_QUEUE)
export class DailyReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(DailyReminderProcessor.name);

  constructor(private readonly checkUseCase: CheckDailyRemindersUseCase) {
    super();
  }

  async process(job: Job): Promise<{ checkedCount: number; notifiedCount: number }> {
    const result = await this.checkUseCase.execute();
    this.logger.log(`Daily reminder job ${job.id}: ${result.notifiedCount}/${result.checkedCount} notified`);
    return result;
  }
}
