import type {
  CreateCompanyRequest,
  CreatedCompany,
} from '../../features/companies/createCompany.types';
import type { Company } from '../../features/companies/types';
import { toCompanyStatus } from './customersApi';
import { request } from './http';
import type {
  CustomerCreatedWire,
  CustomerDetailWire,
  LinkCustomerEsgMetricsRequestWire,
} from './types';

/*
 * Company in scope for the drill-down routes. An unknown id answers 404 with
 * the backend's own PT-BR message ("Empresa não encontrada"), which request()
 * already raises as an ApiError — the not-found screens key off that rejection,
 * so no status is special-cased here.
 */
export async function getCompanyById(companyId: string): Promise<Company> {
  const wire = await request<CustomerDetailWire>(`/customers/${companyId}`);

  return {
    id: wire.id,
    name: wire.name,
    status: toCompanyStatus(wire.status),
    segment: wire.sector?.name ?? '',
    /*
     * GET /customers serves `location` already joined; this endpoint serves the
     * address parts apart, so the same "Cidade - UF" shape is rebuilt to keep a
     * single Company shape across both calls.
     */
    location: [wire.address?.city, wire.address?.state]
      .filter(Boolean)
      .join(' - '),
  };
}

/*
 * The failures this endpoint can return already carry PT-BR copy written by
 * the backend (409 "Já existe uma empresa cadastrada com este CNPJ.", 422 for
 * an unknown sector, 400 for validation), so the ApiError raised by request()
 * is left untouched and rendered verbatim, exactly as the auth forms do.
 */
export async function createCompany(
  input: CreateCompanyRequest
): Promise<CreatedCompany> {
  const wire = await request<CustomerCreatedWire>('/customers', {
    method: 'POST',
    body: input,
  });

  return { id: wire.id, name: wire.name };
}

/** Replaces the company's monitored ESG metrics — answers 204 with no body. */
export async function linkCompanyEsgMetrics(
  companyId: string,
  metricIds: string[]
): Promise<void> {
  const body: LinkCustomerEsgMetricsRequestWire = { metric_ids: metricIds };

  await request<void>(`/customers/${companyId}/esg-metrics`, {
    method: 'POST',
    body,
  });
}
