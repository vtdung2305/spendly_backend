import { resolvePeriodRange } from './period-range.util';
import { SummaryPeriod } from '../dto/period-summary-query.dto';

// Dates in this util are constructed in local time (matching how the rest of the
// app treats `occurredAt`), so assertions must format in local time too — using
// toISOString() here would shift across midnight depending on the CI/test machine's timezone.
function localYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

describe('resolvePeriodRange', () => {
  it('resolves a WEEK range as Monday..Sunday with 7 daily buckets', () => {
    // 2026-07-29 is a Wednesday
    const range = resolvePeriodRange(SummaryPeriod.WEEK, new Date(2026, 6, 29));

    expect(localYmd(range.from)).toBe('2026-07-27'); // Monday
    expect(localYmd(range.to)).toBe('2026-08-03'); // next Monday
    expect(range.bucketCount).toBe(7);
    expect(range.bucketLabels).toEqual(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
    expect(range.bucketOf(new Date(2026, 6, 27))).toBe(0);
    expect(range.bucketOf(new Date(2026, 7, 2))).toBe(6);
  });

  it('resolves a MONTH range split into weekly buckets', () => {
    const range = resolvePeriodRange(SummaryPeriod.MONTH, new Date(2026, 6, 15));

    expect(localYmd(range.from)).toBe('2026-07-01');
    expect(localYmd(range.to)).toBe('2026-08-01');
    expect(range.bucketCount).toBe(5); // 31 days -> ceil(31/7)
    expect(range.bucketOf(new Date(2026, 6, 1))).toBe(0);
    expect(range.bucketOf(new Date(2026, 6, 31))).toBe(4);
  });

  it('resolves a YEAR range into 12 monthly buckets', () => {
    const range = resolvePeriodRange(SummaryPeriod.YEAR, new Date(2026, 6, 15));

    expect(localYmd(range.from)).toBe('2026-01-01');
    expect(localYmd(range.to)).toBe('2027-01-01');
    expect(range.bucketCount).toBe(12);
    expect(range.bucketOf(new Date(2026, 0, 5))).toBe(0);
    expect(range.bucketOf(new Date(2026, 11, 25))).toBe(11);
  });
});
