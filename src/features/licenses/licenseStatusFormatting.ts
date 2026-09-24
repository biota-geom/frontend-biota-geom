/**
 * Tailwind classes for the status badge in the licenses table, keyed by the
 * PT-BR label the API already serves (never re-derived client-side — status
 * is a server-computed value, see the backend's calculateLicenseStatus).
 */
export function getLicenseStatusBadgeTone(status: string): string {
  if (status === 'Regular') return 'bg-[#d8f8ea] text-primary-strong';
  if (status === 'Atenção') return 'bg-amber-100 text-amber-600';
  return 'bg-red-100 text-red-600';
}
