/**
 * Formats a numeric indicator value for display.
 * Uses up to 4 decimal places but trims trailing zeros.
 * Returns an em-dash when the value is null or undefined.
 */
export function formatEsgValue(
  value: number | null | undefined,
  unit: string
): string {
  if (value === null || value === undefined) {
    return '—';
  }

  const formatted = value.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
  return unit ? `${formatted} ${unit}` : formatted;
}
