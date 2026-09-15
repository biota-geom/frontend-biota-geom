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
