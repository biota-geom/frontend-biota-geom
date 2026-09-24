import { type Company } from '../../../features/companies/types';

const CONFORMITY_COLORS = {
  green: { indicator: 'bg-green-500', text: 'text-green-500' },
  orange: { indicator: 'bg-orange-400', text: 'text-orange-400' },
  red: { indicator: 'bg-red-500', text: 'text-red-500' },
} as const;

function getConformityColors(percentage: number) {
  if (percentage >= 95) return CONFORMITY_COLORS.green;
  if (percentage >= 70) return CONFORMITY_COLORS.orange;
  return CONFORMITY_COLORS.red;
}

export function getConformityColor(percentage: number): string {
  return getConformityColors(percentage).indicator;
}

export function getConformityTextColor(percentage: number): string {
  return getConformityColors(percentage).text;
}

export function getStatusLabel(status: Company['status']) {
  return status === 'active' ? 'Ativo' : 'Inativo';
}

/**
 * PT-BR label for the number of companies in the listing header ("1 empresa",
 * "3 empresas"). Zero takes the plural form, as PT-BR does.
 */
export function getCompanyCountLabel(total: number) {
  return total === 1 ? '1 empresa' : `${total} empresas`;
}
