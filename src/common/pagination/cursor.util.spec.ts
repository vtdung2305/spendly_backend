import { encodeCursor, decodeCursor } from './cursor.util';

describe('cursor.util', () => {
  it('round-trips id + Date sortValue through encode/decode', () => {
    const cursor = encodeCursor({ id: 'txn-1', sortValue: new Date('2026-07-29T00:00:00.000Z') });
    const decoded = decodeCursor(cursor);

    expect(decoded).toEqual({ id: 'txn-1', v: '2026-07-29T00:00:00.000Z' });
  });

  it('round-trips a plain string sortValue', () => {
    const cursor = encodeCursor({ id: 'txn-2', sortValue: '2026-07-01' });
    const decoded = decodeCursor(cursor);

    expect(decoded).toEqual({ id: 'txn-2', v: '2026-07-01' });
  });

  it('produces a base64url string with no padding characters', () => {
    const cursor = encodeCursor({ id: 'txn-3', sortValue: new Date() });
    expect(cursor).not.toMatch(/[+/=]/);
  });
});
