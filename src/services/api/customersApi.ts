import type { Company } from '../../features/companies/types';
import { request } from './http';
import type { CustomerWire } from './types';

function toCompany(wire: CustomerWire): Company {
  return {
    id: wire.id,
    name: wire.name,
    status: wire.status === 'Ativo' ? 'active' : 'inactive',
    segment: wire.segment,
    location: wire.location,
  };
}

export async function listCompanies(): Promise<Company[]> {
  const wire = await request<CustomerWire[]>('/customers');
  return wire.map(toCompany);
}
