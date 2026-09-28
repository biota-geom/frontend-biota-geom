export interface Company {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  segment: string;
  location: string;
}

/*
 * A company as served by the portfolio listing (GET /api/customers), which
 * also aggregates per-company data for the cards. Kept apart from Company
 * because GET /api/customers/:id does not serve these fields.
 */
export interface CompanyListItem extends Company {
  totalLicenses: number;
  /** ISO 8601 timestamp of the company's last change. */
  updatedAt: string;
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
