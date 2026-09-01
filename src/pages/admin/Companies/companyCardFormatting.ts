import { type CompanyNavigationItem } from '../../../features/companies/companyNavigation.mock';

export function getComplianceTone(compliance: number) {
  if (compliance >= 90) {
    return '!text-primary-strong';
  }

  if (compliance >= 70) {
    return '!text-amber-500';
  }

  return '!text-red-500';
}

export function getStatusLabel(status: CompanyNavigationItem['status']) {
  return status === 'active' ? 'Ativo' : 'Inativo';
}
