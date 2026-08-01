import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { BudgetsQueryService } from '../../budgets/services/budgets-query.service';
import { NotificationsService } from '../../notifications/services/notifications.service';

const ALERT_THRESHOLD_PERCENT = 80;

/**
 * Fires a BUDGET_ALERT notification the moment an expense pushes a category's
 * monthly spend from under 80% to 80%+ of its budget. Comparing "before this
 * transaction" vs "after" (rather than just checking the current percent) is
 * what keeps this from re-firing on every subsequent expense once already over.
 */
@Injectable()
export class CheckBudgetAlertUseCase {
  private readonly logger = new Logger(CheckBudgetAlertUseCase.name);

  constructor(
    private readonly budgetsQuery: BudgetsQueryService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(params: {
    userId: string;
    categoryId: string;
    categoryName: string;
    occurredAt: Date;
    transactionAmount: number;
  }): Promise<void> {
    try {
      const month = `${params.occurredAt.getFullYear()}-${String(params.occurredAt.getMonth() + 1).padStart(2, '0')}`;
      const status = await this.budgetsQuery.getStatus(params.userId, params.categoryId, month);
      if (!status || status.limitAmount <= 0) return;

      const previousSpent = status.spentAmount - params.transactionAmount;
      const previousPercent = (previousSpent / status.limitAmount) * 100;

      if (previousPercent < ALERT_THRESHOLD_PERCENT && status.usedPercent >= ALERT_THRESHOLD_PERCENT) {
        await this.notifications.notify(params.userId, NotificationType.BUDGET_ALERT, {
          title: 'Cảnh báo ngân sách',
          body: `Bạn đã dùng ${Math.round(status.usedPercent)}% ngân sách ${params.categoryName} tháng này.`,
          icon: 'warning',
          tone: 'warning',
        });
      }
    } catch (error) {
      // Never let a notification failure break the user's "save transaction" action.
      this.logger.error('Budget alert check failed', error as Error);
    }
  }
}
