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

/** 10 -> "▲ 10,0%", -1.3 -> "▼ 1,3%", 0 -> "0,0%", null -> "—". */
export function formatEsgVariation(variationPct: number | null): string {
  if (variationPct === null) {
    return '—';
  }

  const magnitude = Math.abs(variationPct).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  if (variationPct > 0) return `▲ ${magnitude}%`;
  if (variationPct < 0) return `▼ ${magnitude}%`;
  return `${magnitude}%`;
}
