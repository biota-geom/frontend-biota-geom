import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_LICENSE_LEGISLATIONS } from '../../features/legislation/legislations.mock';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { getLicenseLegislations, updateLicenseLegislation } =
  await import('../../services/api/legislationsApi');

describe('legislationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getLicenseLegislations() fetches the radar and maps it to camelCase', async () => {
    vi.mocked(request).mockResolvedValue(MOCK_LICENSE_LEGISLATIONS);

    const radar = await getLicenseLegislations('license-1');

    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/legislations'
    );
    expect(radar).toHaveLength(MOCK_LICENSE_LEGISLATIONS.length);
    expect(radar[0]).toEqual({
      id: '0198f5a1-0000-7000-8000-000000000001',
      legislation: {
        id: '0198f5a0-0000-7000-8000-000000000001',
        type: 'LEI',
        number: '12.305',
        year: 2010,
        issuingBody: 'Governo Federal',
        summary: 'Institui a Política Nacional de Resíduos Sólidos.',
      },
      source: 'SCAN',
      citedExcerpt: '…conforme a Lei nº 12.305/2010…',
      impact: 'HIGH',
      technicalAnalysis: null,
      readAt: null,
      createdAt: '2026-11-02T12:00:00.000Z',
    });
    expect(radar[1].readAt).toBe('2026-11-02T15:30:00.000Z');
    expect(radar[2].technicalAnalysis).toBe(
      MOCK_LICENSE_LEGISLATIONS[2].technical_analysis
    );
  });

  it('getLicenseLegislations() keeps the order the backend returns', async () => {
    vi.mocked(request).mockResolvedValue(
      [...MOCK_LICENSE_LEGISLATIONS].reverse()
    );

    const radar = await getLicenseLegislations('license-1');

    expect(radar.map((item) => item.legislation.year)).toEqual([
      1998, 1997, 2010,
    ]);
  });

  it('getLicenseLegislations() filters by impact on the server', async () => {
    vi.mocked(request).mockResolvedValue([]);

    await getLicenseLegislations('license-1', { impact: 'HIGH' });

    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/legislations?impact=HIGH'
    );
  });

  it('updateLicenseLegislation() PATCHes the entry and maps the answer', async () => {
    vi.mocked(request).mockResolvedValue({
      ...MOCK_LICENSE_LEGISLATIONS[0],
      impact: 'LOW',
      read_at: '2026-11-12T15:00:00.000Z',
    });

    const updated = await updateLicenseLegislation('license-1', 'link-1', {
      impact: 'LOW',
      read: true,
    });

    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/legislations/link-1',
      { method: 'PATCH', body: { impact: 'LOW', read: true } }
    );
    expect(updated.impact).toBe('LOW');
    expect(updated.readAt).toBe('2026-11-12T15:00:00.000Z');
    expect(updated.legislation.issuingBody).toBe('Governo Federal');
  });

  it('updateLicenseLegislation() sends null to clear the impact', async () => {
    vi.mocked(request).mockResolvedValue(MOCK_LICENSE_LEGISLATIONS[1]);

    await updateLicenseLegislation('license-1', 'link-1', { impact: null });

    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/legislations/link-1',
      { method: 'PATCH', body: { impact: null } }
    );
  });
});
