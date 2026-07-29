import { SummaryPeriod } from '../dto/period-summary-query.dto';

export interface PeriodRange {
  from: Date;
  to: Date; // exclusive
  bucketCount: number;
  bucketLabels: string[];
  bucketOf: (date: Date) => number;
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  return d;
}

export function resolvePeriodRange(period: SummaryPeriod, referenceDate: Date): PeriodRange {
  if (period === SummaryPeriod.WEEK) {
    const from = startOfWeekMonday(referenceDate);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    return {
      from,
      to,
      bucketCount: 7,
      bucketLabels: labels,
      bucketOf: (date) => Math.floor((date.getTime() - from.getTime()) / 86_400_000),
    };
  }

  if (period === SummaryPeriod.MONTH) {
    const from = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const to = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
    const daysInMonth = Math.round((to.getTime() - from.getTime()) / 86_400_000);
    const weekCount = Math.ceil(daysInMonth / 7);
    return {
      from,
      to,
      bucketCount: weekCount,
      bucketLabels: Array.from({ length: weekCount }, (_, i) => `T${i + 1}`),
      bucketOf: (date) => Math.min(weekCount - 1, Math.floor((date.getDate() - 1) / 7)),
    };
  }

  // YEAR
  const from = new Date(referenceDate.getFullYear(), 0, 1);
  const to = new Date(referenceDate.getFullYear() + 1, 0, 1);
  return {
    from,
    to,
    bucketCount: 12,
    bucketLabels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    bucketOf: (date) => date.getMonth(),
  };
}
