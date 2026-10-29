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

/**
 * AI suggestions read from a license PDF (POST /licenses/extract). Nothing
 * here is saved: every field is a suggestion the user reviews, and a value
 * the document did not state clearly is null rather than guessed.
 */
export interface ExtractedLicenseData {
  /** As printed (e.g. "LO", "LAO") — both fields are free text on the form. */
  type: string | null;
  processNumber: string | null;
  issuingAgency: string | null;
  /** `YYYY-MM-DD`. */
  issueDate: string | null;
  /** `YYYY-MM-DD`. */
  expirationDate: string | null;
}

export interface SuggestedCondition {
  environmentalDescriptor: string | null;
  description: string;
  conditionType: string | null;
  periodicity: string | null;
  /** `YYYY-MM-DD`. */
  dueDate: string | null;
}

export interface LicenseExtraction {
  extractedData: ExtractedLicenseData;
  suggestedConditions: SuggestedCondition[];
}

export interface ConditionFulfillmentItem {
  conditionId: string;
  fulfilled: boolean;
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
