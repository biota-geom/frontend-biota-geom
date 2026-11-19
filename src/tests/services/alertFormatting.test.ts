import { describe, expect, it } from 'vitest';
import { formatAlertDueDate } from '../../features/alerts/alertFormatting';

describe('formatAlertDueDate', () => {
  it('preserves a midnight UTC calendar date in PT-BR', () => {
    expect(formatAlertDueDate('2026-11-10T00:00:00.000Z')).toBe('10/11/2026');
  });
  it('formats a date-only value', () => {
    expect(formatAlertDueDate('2026-01-01')).toBe('01/01/2026');
  });
  it('handles an invalid date without breaking the popover', () => {
    expect(formatAlertDueDate('invalid')).toBe('Data indisponível');
  });
});
