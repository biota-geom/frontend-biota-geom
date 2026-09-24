import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { listCompanies, toCompanyStatus } =
  await import('../../services/api/customersApi');

describe('customersApi', () => {
  it('listCompanies() fetches /customers and maps status to the domain shape', async () => {
    vi.mocked(request).mockResolvedValue([
      {
        id: 'customer-1',
        name: 'Unidade Industrial RS',
        status: 'Ativo',
        segment: 'Siderurgia',
        location: 'Porto Alegre - RS',
        conformity_percentage: 96,
      },
      {
        id: 'customer-2',
        name: 'Filial SP',
        status: 'Inativo',
        segment: '',
        location: 'São Paulo - SP',
        conformity_percentage: null,
      },
    ]);

    const companies = await listCompanies();

    expect(request).toHaveBeenCalledWith('/api/customers');
    expect(companies).toEqual([
      {
        id: 'customer-1',
        name: 'Unidade Industrial RS',
        status: 'active',
        segment: 'Siderurgia',
        location: 'Porto Alegre - RS',
        conformityPercentage: 96,
      },
      {
        id: 'customer-2',
        name: 'Filial SP',
        status: 'inactive',
        segment: '',
        location: 'São Paulo - SP',
        conformityPercentage: null,
      },
    ]);
  });

  /*
   * Divergência confirmada no backend: GET /customers devolve o rótulo em
   * PT-BR e GET /customers/:id devolve o enum em inglês. As duas grafias são
   * normalizadas aqui para que o detalhe não caia silenciosamente em
   * "inactive".
   */
  describe('toCompanyStatus()', () => {
    it.each([
      ['Ativo', 'active'],
      ['ativo', 'active'],
      ['active', 'active'],
      ['  Active  ', 'active'],
      ['Inativo', 'inactive'],
      ['inactive', 'inactive'],
      ['', 'inactive'],
      ['desconhecido', 'inactive'],
    ])('maps %s to %s', (wire, expected) => {
      expect(toCompanyStatus(wire)).toBe(expected);
    });
  });
});
