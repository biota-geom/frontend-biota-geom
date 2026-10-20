import type { EsgIndicatorKey } from './types';

export function formatEsgValue(
  value: number | null | undefined,
  indicator: EsgIndicatorKey
): string {
  if (value === null || value === undefined) {
    return '—';
  }

  switch (indicator) {
    case 'water':
      return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m³/mês`;
    case 'waste':
      return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ton/mês`;
    case 'employees':
      return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} pessoas`;
    case 'energy':
      return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh/mês`;
  }
}
