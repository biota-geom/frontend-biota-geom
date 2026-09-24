export interface Company {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  segment: string;
  location: string;
  /**
   * Percentage returned by GET /api/customers. The company detail endpoint
   * does not expose this summary value yet, so it is absent in that context.
   */
  conformityPercentage?: number | null;
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
