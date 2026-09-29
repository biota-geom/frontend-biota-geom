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

/*
 * Pinned to Brasília time so the day shown does not depend on the viewer's
 * machine clock: a change made at 23:30 in Porto Alegre is still that day.
 */
const LAST_UPDATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

/** Card footer date in the Brazilian `dd/MM/yyyy` form, from an ISO string. */
export function formatLastUpdate(isoDate: string) {
  return LAST_UPDATE_FORMAT.format(new Date(isoDate));
}
