import type {
  CompanyDetail,
  CompanyWire,
} from '../../features/companies/types';
import { request } from './http';

function toCompany(wire: CompanyWire): CompanyDetail {
  return {
    id: wire.id,
    name: wire.name,
    document: wire.document,
    documentType: wire.document_type,
    status: wire.status,
    sector: wire.sector,
    address: wire.address,
  };
}

export async function getCompanyById(
  companyId: string
): Promise<CompanyDetail> {
  const wire = await request<CompanyWire>(
    `/api/customers/${encodeURIComponent(companyId)}`
  );

  return toCompany(wire);
}
