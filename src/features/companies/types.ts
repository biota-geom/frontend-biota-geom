export interface Company {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  segment: string;
  location: string;
}

/** Business segment a company is linked to — served by GET /sectors. */
export interface Sector {
  id: string;
  name: string;
  description: string | null;
}

/** ESG metric a company can be asked to report — served by GET /api/esg-metrics. */
export interface EsgIndicator {
  id: string;
  name: string;
  unit: string;
}
