import { type Company } from '../../../features/companies/types';

export function getComplianceTone(compliance: number) {
  if (compliance >= 90) {
    return '!text-primary-strong';
  }

  if (compliance >= 70) {
    return '!text-amber-500';
  }

  return '!text-red-500';
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
