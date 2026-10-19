import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { getEsgIndicators, saveEsgIndicators } =
  await import('../../services/api/esgIndicatorsApi');

describe('esgIndicatorsApi', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('getEsgIndicators() fetches the month of the company', async () => {
    vi.mocked(request).mockResolvedValue({
      water: 1250.5,
      waste: 12.3,
      employees: 148,
      energy: 53200,
    });

    const indicators = await getEsgIndicators('customer-1', '2026-09');

    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/esg-indicators/2026-09'
    );
    expect(indicators).toEqual({
      water: 1250.5,
      waste: 12.3,
      employees: 148,
      energy: 53200,
    });
  });

  it('reads decimals that the API serialises as strings', async () => {
    vi.mocked(request).mockResolvedValue({
      water: '1250.50',
      waste: '12.3',
      employees: 148,
      energy: '0',
    });

    expect(await getEsgIndicators('customer-1', '2026-09')).toEqual({
      water: 1250.5,
      waste: 12.3,
      employees: 148,
      energy: 0,
    });
  });

  it('maps missing, null, blank and non-numeric values to null', async () => {
    vi.mocked(request).mockResolvedValue({
      water: null,
      waste: '',
      employees: 'abc',
    });

    expect(await getEsgIndicators('customer-1', '2026-09')).toEqual({
      water: null,
      waste: null,
      employees: null,
      energy: null,
    });
  });

  it('treats an empty response body as an empty month', async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    expect(await getEsgIndicators('customer-1', '2026-08')).toEqual({
      water: null,
      waste: null,
      employees: null,
      energy: null,
    });
  });

  it('saveEsgIndicators() PUTs only the given indicators', async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    await saveEsgIndicators('customer-1', '2026-09', {
      water: 1250.5,
      employees: 148,
    });

    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/esg-indicators/2026-09',
      { method: 'PUT', body: { water: 1250.5, employees: 148 } }
    );
  });

  it('saveEsgIndicators() sends null to clear a saved indicator', async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    await saveEsgIndicators('customer-1', '2026-09', { water: null, waste: 3 });

    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/esg-indicators/2026-09',
      { method: 'PUT', body: { water: null, waste: 3 } }
    );
  });
});
