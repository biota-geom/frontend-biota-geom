import { describe, expect, it } from 'vitest';
import { getLicenseStatusBadgeTone } from '../../features/licenses/licenseStatusFormatting';

describe('getLicenseStatusBadgeTone', () => {
  it.each([
    ['Regular', 'bg-[#d8f8ea] text-primary-strong'],
    ['Atenção', 'bg-amber-100 text-amber-600'],
    ['Renovada/Arquivada', 'bg-slate-100 text-slate-600'],
    ['Vencida', 'bg-red-100 text-red-600'],
  ])('maps %s to the expected badge tone', (status, tone) => {
    expect(getLicenseStatusBadgeTone(status)).toBe(tone);
  });
});
