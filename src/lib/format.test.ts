import { describe, expect, it } from 'vitest';
import { formatDate, formatTime, localDayKey } from './format';

describe('format', () => {
  const d = new Date(2026, 0, 5, 9, 7); // 5 Jan 2026, 09:07 local

  it('formats dates as DD.MM.YYYY', () => {
    expect(formatDate(d)).toBe('05.01.2026');
    expect(formatDate(d.getTime())).toBe('05.01.2026');
  });

  it('formats times in 24h', () => {
    expect(formatTime(d)).toBe('09:07');
    expect(formatTime(new Date(2026, 0, 5, 21, 30).getTime())).toBe('21:30');
  });

  it('builds local day keys', () => {
    expect(localDayKey(d)).toBe('2026-01-05');
    expect(localDayKey(d.getTime())).toBe('2026-01-05');
  });
});
