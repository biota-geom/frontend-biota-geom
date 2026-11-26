import { formatLicenseStatus } from './licenseDetailsFormatting';

/**
 * Tailwind classes for the status badge in the licenses table and dashboard,
 * normalizing both raw API enums and PT-BR labels to the same tone.
 */
export function getLicenseStatusBadgeTone(status: string): string {
  const normalized = formatLicenseStatus(status);
  if (normalized === 'Regular') return 'bg-[#d8f8ea] text-primary-strong';
  if (normalized === 'Atenção') return 'bg-amber-100 text-amber-600';
  if (normalized === 'Renovada/Arquivada') {
    return 'bg-slate-100 text-slate-600';
  }
  return 'bg-red-100 text-red-600';
}
