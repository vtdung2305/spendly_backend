import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { GenerateRecurringTransactionsUseCase } from '../usecases/generate-recurring-transactions.usecase';
import { RECURRING_TRANSACTIONS_QUEUE } from './recurring-transactions-queue.constants';

@Processor(RECURRING_TRANSACTIONS_QUEUE)
export class RecurringTransactionsProcessor extends WorkerHost {
  private readonly logger = new Logger(RecurringTransactionsProcessor.name);

  constructor(private readonly generateUseCase: GenerateRecurringTransactionsUseCase) {
    super();
  }

  async process(job: Job): Promise<{ generatedCount: number; dueCount: number }> {
    const result = await this.generateUseCase.execute();
    this.logger.log(`Recurring transactions job ${job.id}: ${result.generatedCount}/${result.dueCount} generated`);
    return result;
  }
}
