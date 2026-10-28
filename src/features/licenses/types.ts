export interface IssuingAgency {
  id: string;
  name: string;
  acronym: string | null;
}

export interface License {
  id: string;
  customerId: string;
  type: string;
  processNumber: string;
  issuingAgency: string;
  issueDate: string;
  expirationDate: string;
  status: string;
  documentUrl: string;
  createdAt: string;
}

export interface LicenseConditionDetail {
  id: string | null;
  itemNumber: string;
  isEnvironmentalDescriptor: boolean;
  environmentalDescriptor: string;
  name: string | null;
  description: string | null;
  conditionType: string | null;
  periodicity: string;
  deadline: string | null;
  status: string | null;
  completionDate: string | null;
  responsibleName: string | null;
  hasDelivery: boolean | null;
  isViolated: boolean;
}

export interface LicenseDetails {
  id: string;
  processNumber: string;
  type: string;
  issuingAgency: string | null;
  issueDate: string;
  expirationDate: string;
  status: string;
  conditions: LicenseConditionDetail[];
}

export interface LicenseRenewed {
  id: string;
  previousLicenseId: string;
  status: string;
}

export interface LicenseVersion {
  id: string;
  processNumber: string;
  issueDate: string;
  expirationDate: string;
  status: string;
  /** True for the license that was requested; the others are previous versions. */
  isCurrent: boolean;
}

export interface LicenseSummary {
  total: number;
  regular: number;
  attention: number;
  expired: number;
}

/**
 * A row of the "Painel de Licenças" table (GET /customers/:id/licenses).
 * `type` and `status` are already PT-BR display labels served by the API —
 * unlike `License.type` above, which is the raw "LP"/"LI"/"LO" code from the
 * create endpoint.
 */
export interface LicensePanelItem {
  id: string;
  type: string;
  processNumber: string;
  issuingAgency: string | null;
  issueDate: string;
  expirationDate: string;
  status: string;
  /** URL of the license PDF document, or null when none is stored yet. */
  documentUrl: string | null;
}

/** Temporary URL to view a license PDF (GET /licenses/:id/document/url). */
export interface LicenseDocumentUrl {
  url: string;
  /** Seconds until `url` expires, or null when it does not expire. */
  expiresIn: number | null;
}

export interface LicensesPanel {
  summary: LicenseSummary;
  licenses: LicensePanelItem[];
}

export interface ConditionFulfillmentItem {
  conditionId: string;
  fulfilled: boolean;
}

/** What the renewal decides for each condition of the previous license. */
export interface RenewalConditionDecision extends ConditionFulfillmentItem {
  copyToNew: boolean;
  /** `YYYY-MM-DD`; only present when `copyToNew` is true. */
  newDueDate?: string;
}

/**
 * One row in the ConditionFulfillmentList component.
 * `fulfilled` is `undefined` when the user hasn't answered yet.
 */
export interface ConditionFulfillmentRow {
  conditionId: string;
  itemNumber: string | null;
  description: string | null;
  conditionType: string | null;
  fulfilled: boolean | undefined;
}

export interface LicenseDashboardHeader {
  activeLicenses: number;
  pendingItems: number;
}

export interface LicenseDashboardCounts {
  regular: number;
  attention: number;
  expired: number;
}

export interface LicenseDashboardCriticalItem {
  id: string;
  type: string;
  processNumber: string;
  expirationDate: string;
  status: string;
}

export interface LicenseDashboard {
  header: LicenseDashboardHeader;
  counts: LicenseDashboardCounts;
  critical: LicenseDashboardCriticalItem[];
}
