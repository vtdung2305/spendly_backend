import { Injectable } from '@nestjs/common';
import { ReminderSettings } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const DEFAULTS = {
  dailyExpenseReminder: true,
  budgetAlertReminder: true,
  recurringAlertReminder: false,
  dailyReminderTime: '20:00',
};

@Injectable()
export class ReminderSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserOrDefault(userId: string): Promise<ReminderSettings> {
    const existing = await this.prisma.reminderSettings.findUnique({ where: { userId } });
    if (existing) return existing;
    // Virtual default — not persisted until the user actually changes something,
    // so a fresh account doesn't need a migration-time backfill.
    return { userId, ...DEFAULTS, updatedAt: new Date() };
  }

  upsert(userId: string, data: Partial<typeof DEFAULTS>): Promise<ReminderSettings> {
    return this.prisma.reminderSettings.upsert({
      where: { userId },
      create: { userId, ...DEFAULTS, ...data },
      update: data,
    });
  }

  /** Users whose daily-expense reminder is on and configured for this exact "HH:00" slot. */
  findDueForDailyReminder(hhmm: string) {
    return this.prisma.reminderSettings.findMany({
      where: { dailyExpenseReminder: true, dailyReminderTime: hhmm },
    });
  }
}
