import type { Company, CompanyListItem } from '../../features/companies/types';
import { request } from './http';
import type { CustomerWire } from './types';

/*
 * Backend divergence, confirmed at runtime: GET /customers serves `status` as a
 * PT-BR label ("Ativo"/"Inativo"), while GET /customers/:id serves the raw enum
 * ("active"/"inactive"). Both spellings are normalised here so reusing this
 * mapping for the detail endpoint cannot silently degrade a company to
 * "inactive". Shared with companiesApi.getCompanyById() for that reason.
 */
export function toCompanyStatus(status: string): Company['status'] {
  const normalized = status.trim().toLowerCase();

  return normalized === 'ativo' || normalized === 'active'
    ? 'active'
    : 'inactive';
}

function toCompanyListItem(wire: CustomerWire): CompanyListItem {
  return {
    id: wire.id,
    name: wire.name,
    status: toCompanyStatus(wire.status),
    segment: wire.segment,
    location: wire.location,
    attentionCount: wire.attention_count,
    expiredCount: wire.expired_count,
    conformityPercentage: wire.conformity_percentage,
    totalLicenses: wire.total_licenses,
    updatedAt: wire.updated_at,
  };
}

export async function listCompanies(): Promise<CompanyListItem[]> {
  const wire = await request<CustomerWire[]>('/api/customers');
  return wire.map(toCompanyListItem);
}
