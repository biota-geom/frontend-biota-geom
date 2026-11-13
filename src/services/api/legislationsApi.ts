import type {
  LegislationImpact,
  LicenseLegislation,
} from '../../features/legislation/types';
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

export interface LicenseLegislationFilter {
  impact?: LegislationImpact;
}

/** What the radar's PATCH accepts; send only the fields being changed. */
export interface LicenseLegislationUpdate {
  /** `null` clears the classification. */
  impact?: LegislationImpact | null;
  /** The backend only accepts `true`: an entry can't go back to unread. */
  read?: true;
}

/**
 * The license radar, most recent legislation first (ordered by the backend).
 * `filter.impact` narrows it to one impact level.
 */
export async function getLicenseLegislations(
  licenseId: string,
  filter: LicenseLegislationFilter = {}
): Promise<LicenseLegislation[]> {
  const query = filter.impact ? `?impact=${filter.impact}` : '';
  const wire = await request<LicenseLegislationWire[]>(
    `/api/licenses/${licenseId}/legislations${query}`
  );

  return wire.map(toLicenseLegislation);
}

/** Classifies an entry's impact and/or marks it as read; returns the entry. */
export async function updateLicenseLegislation(
  licenseId: string,
  id: string,
  update: LicenseLegislationUpdate
): Promise<LicenseLegislation> {
  const wire = await request<LicenseLegislationWire>(
    `/api/licenses/${licenseId}/legislations/${id}`,
    { method: 'PATCH', body: update }
  );

  return toLicenseLegislation(wire);
}
