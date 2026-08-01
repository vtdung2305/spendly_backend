import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { RecurringTransactionsRepository } from '../repositories/recurring-transactions.repository';
import { CreateTransactionUseCase } from '../../transactions/usecases/create-transaction.usecase';
import { NotificationsService } from '../../notifications/services/notifications.service';

// Local-date formatting: toISOString() would shift the date in any UTC+ timezone.
function localYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

/**
 * Run once a day (see RecurringTransactionsSchedulerService). For every active
 * recurring transaction whose dayOfMonth matches today and that hasn't already
 * generated a Transaction this month, creates one and stamps lastGeneratedMonth
 * so a re-run the same day (or a retry) never double-generates.
 */
@Injectable()
export class GenerateRecurringTransactionsUseCase {
  private readonly logger = new Logger(GenerateRecurringTransactionsUseCase.name);

  constructor(
    private readonly repo: RecurringTransactionsRepository,
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(referenceDate: Date = new Date()): Promise<{ generatedCount: number; dueCount: number }> {
    const day = referenceDate.getDate();
    const monthKey = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`;
    const occurredAt = localYmd(referenceDate);

    const due = await this.repo.findDueForGeneration(day, monthKey);

    let generatedCount = 0;
    for (const recurring of due) {
      try {
        await this.createTransaction.execute(recurring.userId, {
          type: recurring.type,
          categoryId: recurring.categoryId,
          amount: Number(recurring.amount),
          note: recurring.label,
          occurredAt,
        });
        await this.repo.markGenerated(recurring.id, monthKey);
        generatedCount++;

        await this.notifications.notify(recurring.userId, NotificationType.RECURRING_GENERATED, {
          title: 'Giao dịch định kỳ',
          body: `Đã tự động tạo giao dịch "${recurring.label}" ${formatVnd(Number(recurring.amount))} ₫.`,
          icon: 'event_repeat',
          tone: 'success',
        });
      } catch (error) {
        // Don't let one bad row (e.g. its category was deleted since setup)
        // abort the whole batch — log and retry naturally next month.
        this.logger.error(`Failed to generate transaction for recurring ${recurring.id}`, error as Error);
      }
    }

    return { generatedCount, dueCount: due.length };
  }
}
