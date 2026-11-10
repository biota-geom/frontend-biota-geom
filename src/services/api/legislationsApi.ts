import type { LicenseLegislation } from '../../features/legislation/types';
import { request } from './http';
import type { LicenseLegislationWire } from './types';

export function toLicenseLegislation(
  wire: LicenseLegislationWire
): LicenseLegislation {
  return {
    id: wire.id,
    legislation: {
      id: wire.legislation.id,
      type: wire.legislation.type,
      number: wire.legislation.number,
      year: wire.legislation.year,
      issuingBody: wire.legislation.issuing_body,
      summary: wire.legislation.summary,
    },
    source: wire.source,
    citedExcerpt: wire.cited_excerpt,
    impact: wire.impact,
    technicalAnalysis: wire.technical_analysis,
    readAt: wire.read_at,
    createdAt: wire.created_at,
  };
}

/** The license radar, most recent legislation first (ordered by the backend). */
export async function getLicenseLegislations(
  licenseId: string
): Promise<LicenseLegislation[]> {
  const wire = await request<LicenseLegislationWire[]>(
    `/api/licenses/${licenseId}/legislations`
  );

  return wire.map(toLicenseLegislation);
}
