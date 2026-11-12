import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_LICENSE_LEGISLATIONS } from '../../features/legislation/legislations.mock';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const {
  addLicenseLegislation,
  getLicenseLegislations,
  removeLicenseLegislation,
  updateLicenseLegislation,
} = await import('../../services/api/legislationsApi');

const ACT = {
  type: 'LEI' as const,
  number: '12.305',
  year: 2010,
  issuingBody: 'Governo Federal',
  summary: 'Institui a PNRS.',
};

const ACT_WIRE = {
  type: 'LEI',
  number: '12.305',
  year: 2010,
  issuing_body: 'Governo Federal',
  summary: 'Institui a PNRS.',
};

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

  it('addLicenseLegislation() posts the act data and maps the new entry', async () => {
    vi.mocked(request).mockResolvedValue(MOCK_LICENSE_LEGISLATIONS[2]);

    const created = await addLicenseLegislation('license-1', {
      legislation: ACT,
      citedExcerpt: null,
    });

    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/legislations',
      {
        method: 'POST',
        body: { legislation: ACT_WIRE, cited_excerpt: null },
      }
    );
    expect(created.id).toBe(MOCK_LICENSE_LEGISLATIONS[2].id);
    expect(created.legislation.issuingBody).toBe(
      MOCK_LICENSE_LEGISLATIONS[2].legislation.issuing_body
    );
  });

  it('updateLicenseLegislation() patches the excerpt and, when given, the act', async () => {
    vi.mocked(request).mockResolvedValue(MOCK_LICENSE_LEGISLATIONS[0]);

    await updateLicenseLegislation('license-1', 'link-1', {
      citedExcerpt: 'art. 3º',
    });
    expect(request).toHaveBeenLastCalledWith(
      '/api/licenses/license-1/legislations/link-1',
      { method: 'PATCH', body: { cited_excerpt: 'art. 3º' } }
    );

    const updated = await updateLicenseLegislation('license-1', 'link-1', {
      citedExcerpt: null,
      legislation: ACT,
    });
    expect(request).toHaveBeenLastCalledWith(
      '/api/licenses/license-1/legislations/link-1',
      {
        method: 'PATCH',
        body: { cited_excerpt: null, legislation: ACT_WIRE },
      }
    );
    expect(updated.id).toBe(MOCK_LICENSE_LEGISLATIONS[0].id);
  });

  it('removeLicenseLegislation() deletes the radar entry', async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    await expect(
      removeLicenseLegislation('license-1', 'link-1')
    ).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/legislations/link-1',
      { method: 'DELETE' }
    );
  });
});
