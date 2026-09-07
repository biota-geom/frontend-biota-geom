import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { getCompanyById } = await import('../../services/api/companiesApi');

describe('companiesApi', () => {
  it('gets a company by id and maps the response to the frontend shape', async () => {
    vi.mocked(request).mockResolvedValue({
      id: 'company-1',
      name: 'Unidade Industrial RS',
      document: '12345678000199',
      document_type: 'cnpj',
      status: 'active',
      sector: {
        id: 'sector-1',
        name: 'Siderurgia',
      },
      address: {
        city: 'Porto Alegre',
        state: 'RS',
      },
    });

    const company = await getCompanyById('company-1');

    expect(request).toHaveBeenCalledWith('/api/customers/company-1');
    expect(company).toEqual({
      id: 'company-1',
      name: 'Unidade Industrial RS',
      document: '12345678000199',
      documentType: 'cnpj',
      status: 'active',
      sector: {
        id: 'sector-1',
        name: 'Siderurgia',
      },
      address: {
        city: 'Porto Alegre',
        state: 'RS',
      },
    });
  });

  it('encodes the company id before adding it to the request path', async () => {
    vi.mocked(request).mockResolvedValue({
      id: 'company/1',
      name: 'Empresa',
      document: '123',
      document_type: 'cnpj',
      status: 'inactive',
      sector: { id: 'sector-1', name: 'Setor' },
      address: { city: 'Cidade', state: 'SP' },
    });

    await getCompanyById('company/1');

    expect(request).toHaveBeenCalledWith('/api/customers/company%2F1');
  });
});
