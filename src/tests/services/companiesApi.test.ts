import { describe, expect, it, vi } from 'vitest';
import type { CreateCompanyRequest } from '../../features/companies/createCompany.types';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { ApiError } = await import('../../services/api/apiError');
const { createCompany, getCompanyById, linkCompanyEsgMetrics } =
  await import('../../services/api/companiesApi');

const CREATE_REQUEST: CreateCompanyRequest = {
  name: 'Unidade Industrial RS',
  document: '77666555000144',
  document_type: 'CNPJ',
  sector_id: '01a0a21c-fd40-762b-a1a9-744bd7cf47ee',
  email: 'contato@unidade.com.br',
  owner_name: 'Maria Silva',
  owner_email: 'maria@unidade.com.br',
  owner_phone: '(51) 99999-0000',
  address: {
    type: 'BILLING',
    street: 'Av. Assis Brasil',
    number: '1234',
    city: 'Porto Alegre',
    state: 'RS',
    postal_code: '91010-000',
    country_code: 'BR',
  },
};

describe('companiesApi', () => {
  it('gets a company from GET /customers/:id and rebuilds the domain shape', async () => {
    vi.mocked(request).mockResolvedValue({
      id: 'company-1',
      name: 'Unidade Industrial Ouro Preto',
      document: '12345678000199',
      document_type: 'CNPJ',
      status: 'active',
      sector: { id: 'sector-1', name: 'Mineração' },
      address: { city: 'Ouro Preto', state: 'MG' },
    });

    const company = await getCompanyById('company-1');

    expect(request).toHaveBeenCalledWith('/api/customers/company-1');
    expect(company).toEqual({
      id: 'company-1',
      name: 'Unidade Industrial Ouro Preto',
      status: 'active',
      segment: 'Mineração',
      location: 'Ouro Preto - MG',
    });
  });

  /*
   * The detail endpoint answers the raw enum while the listing answers a PT-BR
   * label — reusing the listing's mapping verbatim would silently report every
   * company as inactive here.
   */
  it('maps the English status served by the detail endpoint', async () => {
    vi.mocked(request).mockResolvedValue({
      id: 'company-2',
      name: 'Fazenda Santa Clara',
      document: '12345678000199',
      document_type: 'CNPJ',
      status: 'inactive',
      sector: { id: 'sector-2', name: 'Agronegócio' },
      address: { city: 'Sorriso', state: 'MT' },
    });

    await expect(getCompanyById('company-2')).resolves.toMatchObject({
      status: 'inactive',
    });
  });

  it('tolerates a company served without sector or address', async () => {
    vi.mocked(request).mockResolvedValue({
      id: 'company-3',
      name: 'Empresa Sem Vínculos',
      document: '12345678000199',
      document_type: 'CNPJ',
      status: 'active',
      sector: null,
      address: null,
    });

    await expect(getCompanyById('company-3')).resolves.toEqual({
      id: 'company-3',
      name: 'Empresa Sem Vínculos',
      status: 'active',
      segment: '',
      location: '',
    });
  });

  it('propagates the backend 404 for an unknown company id', async () => {
    vi.mocked(request).mockRejectedValue(
      new ApiError(404, 'Empresa não encontrada')
    );

    await expect(getCompanyById('missing-company')).rejects.toMatchObject({
      status: 404,
      message: 'Empresa não encontrada',
    });
  });

  it('createCompany() posts the request body to /customers untouched', async () => {
    vi.mocked(request).mockResolvedValue({
      id: 'customer-9',
      name: 'Unidade Industrial RS',
    });

    const created = await createCompany(CREATE_REQUEST);

    expect(request).toHaveBeenCalledWith('/api/customers', {
      method: 'POST',
      body: CREATE_REQUEST,
    });
    expect(created).toEqual({
      id: 'customer-9',
      name: 'Unidade Industrial RS',
    });
  });

  it('createCompany() propagates the backend message on a duplicate CNPJ', async () => {
    vi.mocked(request).mockRejectedValue(
      new ApiError(409, 'Já existe uma empresa cadastrada com este CNPJ.')
    );

    await expect(createCompany(CREATE_REQUEST)).rejects.toMatchObject({
      status: 409,
      message: 'Já existe uma empresa cadastrada com este CNPJ.',
    });
  });

  it('linkCompanyEsgMetrics() posts the metric ids to the customer sub-resource', async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    await linkCompanyEsgMetrics('customer-9', ['metric-1', 'metric-2']);

    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-9/esg-metrics',
      {
        method: 'POST',
        body: { metric_ids: ['metric-1', 'metric-2'] },
      }
    );
  });
});
