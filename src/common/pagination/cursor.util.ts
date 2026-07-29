export interface CursorPayload {
  id: string;
  v: string;
}

export function encodeCursor(record: { id: string; sortValue: Date | string }): string {
  const v = record.sortValue instanceof Date ? record.sortValue.toISOString() : record.sortValue;
  return Buffer.from(JSON.stringify({ id: record.id, v })).toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload {
  return JSON.parse(Buffer.from(cursor, 'base64url').toString());
}
