import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/licensesApi', () => ({
  listLicenses: vi.fn(),
}));

const licensesApi = await import('../../services/api/licensesApi');
const { useLicensesPanel } =
  await import('../../features/licenses/useLicensesPanel');

const PANEL = {
  summary: { total: 2, regular: 1, attention: 0, expired: 1 },
  licenses: [
    {
      id: 'license-1',
      type: 'Licença Prévia (LP)',
      processNumber: 'LP nº 482/2024',
      issuingAgency: 'FEPAM',
      issueDate: '2024-03-12T00:00:00.000Z',
      expirationDate: '2026-03-12T00:00:00.000Z',
      status: 'Regular',
    },
    {
      id: 'license-2',
      type: 'Licença de Operação (LO)',
      processNumber: 'LO nº 118/2020',
      issuingAgency: 'FEPAM',
      issueDate: '2020-01-10T00:00:00.000Z',
      expirationDate: '2025-01-10T00:00:00.000Z',
      status: 'Vencida',
    },
  ],
};

describe('useLicensesPanel store', () => {
  beforeEach(() => {
    useLicensesPanel.setState({
      summary: null,
      licenses: [],
      status: 'idle',
      error: null,
      requestedCustomerId: null,
    });
    vi.resetAllMocks();
  });

  it('loadLicenses() loads the summary and licenses and marks the store successful', async () => {
    vi.mocked(licensesApi.listLicenses).mockResolvedValue(PANEL);

    await useLicensesPanel.getState().loadLicenses('customer-1');

    expect(licensesApi.listLicenses).toHaveBeenCalledWith('customer-1');
    expect(useLicensesPanel.getState().status).toBe('success');
    expect(useLicensesPanel.getState().summary).toEqual(PANEL.summary);
    expect(useLicensesPanel.getState().licenses).toEqual(PANEL.licenses);
    expect(useLicensesPanel.getState().error).toBeNull();
  });

  it('loadLicenses() surfaces the API error message on failure', async () => {
    vi.mocked(licensesApi.listLicenses).mockRejectedValue(
      new ApiError(404, 'Empresa não encontrada.')
    );

    await useLicensesPanel.getState().loadLicenses('customer-1');

    expect(useLicensesPanel.getState().status).toBe('error');
    expect(useLicensesPanel.getState().error).toBe('Empresa não encontrada.');
  });

  it('loadLicenses() falls back to a generic message for a non-API error', async () => {
    vi.mocked(licensesApi.listLicenses).mockRejectedValue(new Error('boom'));

    await useLicensesPanel.getState().loadLicenses('customer-1');

    expect(useLicensesPanel.getState().status).toBe('error');
    expect(useLicensesPanel.getState().error).toBe(
      'Não foi possível carregar as licenças da empresa.'
    );
  });

  it('drops a response for a customerId the caller has since navigated away from', async () => {
    let resolveFirst!: (value: typeof PANEL) => void;
    vi.mocked(licensesApi.listLicenses).mockImplementation((customerId) => {
      if (customerId === 'customer-1') {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      return Promise.resolve({
        summary: { total: 0, regular: 0, attention: 0, expired: 0 },
        licenses: [],
      });
    });

    const first = useLicensesPanel.getState().loadLicenses('customer-1');
    await useLicensesPanel.getState().loadLicenses('customer-2');

    resolveFirst(PANEL);
    await first;

    expect(useLicensesPanel.getState().requestedCustomerId).toBe('customer-2');
    expect(useLicensesPanel.getState().summary).toEqual({
      total: 0,
      regular: 0,
      attention: 0,
      expired: 0,
    });
  });
});
