import type { Company } from '../../features/companies/types';
import { ApiError } from './apiError';
import { listCompanies } from './customersApi';

export async function getCompanyById(companyId: string): Promise<Company> {
  const company = (await listCompanies()).find(
    (candidate) => candidate.id === companyId
  );

  if (!company) {
    throw new ApiError(404, 'Empresa não encontrada.');
  }

  return company;
}
