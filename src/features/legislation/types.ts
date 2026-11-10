import type {
  LegislationImpactWire,
  LegislationTypeWire,
  LicenseLegislationSourceWire,
} from '../../services/api/types';

export type LegislationType = LegislationTypeWire;
export type LicenseLegislationSource = LicenseLegislationSourceWire;
export type LegislationImpact = LegislationImpactWire;

export interface Legislation {
  id: string;
  type: LegislationType;
  number: string;
  year: number;
  issuingBody: string;
  summary: string | null;
}

/** One entry of a license's radar. `id` is the link's id, not the legislation's. */
export interface LicenseLegislation {
  id: string;
  legislation: Legislation;
  source: LicenseLegislationSource;
  citedExcerpt: string | null;
  impact: LegislationImpact | null;
  technicalAnalysis: string | null;
  readAt: string | null;
  createdAt: string;
}
