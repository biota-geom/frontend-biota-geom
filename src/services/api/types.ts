/*
 * Wire shapes match the backend contract exactly (snake_case) — never rename
 * these fields, they're what actually crosses the network.
 */
export interface UserWire {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AuthResponseWire {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: UserWire;
}

export interface RefreshResponseWire {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: UserWire;
}

/*
 * `message` has two shapes on the wire, both legitimate: routes that throw an
 * HttpException by hand (all of /auth) send a plain string, while routes whose
 * DTO goes through Nest's ValidationPipe (/customers) send one string per
 * failed class-validator constraint — {"message":["Informe um CNPJ válido."]}.
 */
export interface ApiErrorWire {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface RegisterRequestWire {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginRequestWire {
  email: string;
  password: string;
}

export interface RefreshRequestWire {
  refresh_token: string;
}

export interface CustomerWire {
  id: string;
  name: string;
  status: string;
  segment: string;
  location: string;
  attention_count: number;
  expired_count: number;
  conformity_percentage: number | null;
  total_licenses: number;
  updated_at: string;
}

/*
 * GET /customers/:id. Two confirmed divergences from CustomerWire (the listing
 * served by GET /customers), which is why they are two types and not one:
 * - `status` is the raw enum here ("active"/"inactive"), while the listing
 *   serves a PT-BR label ("Ativo"/"Inativo") — see toCompanyStatus().
 * - the listing serves `location` already joined as "Cidade - UF"; the detail
 *   serves the address parts separately.
 */
export interface CustomerDetailWire {
  id: string;
  name: string;
  document: string;
  document_type: string;
  status: string;
  sector: { id: string; name: string } | null;
  address: { city: string; state: string } | null;
}

export interface SectorWire {
  id: string;
  name: string;
  description: string | null;
}

/*
 * The request body for POST /customers is written down once, as the feature's
 * CreateCompanyRequest — it already mirrors CreateCustomerDto key for key, so
 * restating it here would be the same contract in two places.
 *
 * The response echoes the persisted address and timestamps too; only the
 * fields the UI actually reads are typed.
 */
export interface CustomerCreatedWire {
  id: string;
  name: string;
}

export interface LinkCustomerEsgMetricsRequestWire {
  metric_ids: string[];
}

export interface CreateEsgMetricRequestWire {
  name: string;
  unit: string;
  pillar: 'AMBIENTAL' | 'SOCIAL' | 'GOVERNANCA';
  gri_standard_id?: string;
}

export interface EsgMetricWire {
  id: string;
  name: string;
  unit: string;
  pillar: 'AMBIENTAL' | 'SOCIAL' | 'GOVERNANCA';
  /** Null for the global catalog; set on metrics owned by a single customer. */
  customer_id: string | null;
  gri_standard_id: string | null;
}

export interface IssuingAgencyWire {
  id: string;
  name: string;
  acronym: string | null;
}

export interface LicenseWire {
  id: string;
  customer_id: string;
  type: string;
  process_number: string;
  issuing_agency_id: string;
  issuing_agency_name: string | null;
  issue_date: string;
  expiration_date: string;
  status: string;
  document_url: string;
  created_at: string;
}

export interface LicenseConditionDetailsWire {
  id: string | null;
  item_number: string;
  is_environmental_descriptor: boolean;
  environmental_descriptor: string;
  name: string | null;
  description: string | null;
  condition_type: string | null;
  periodicity: string;
  deadline: string | null;
  status: string | null;
  completion_date: string | null;
  responsible_name: string | null;
  has_delivery: boolean | null;
  is_violated: boolean;
}

export interface LicenseDetailsWire {
  id: string;
  process_number: string;
  type: string;
  issuing_agency: string | null;
  issue_date: string;
  expiration_date: string;
  status: string;
  conditions: LicenseConditionDetailsWire[];
}

export interface LicenseRenewedWire {
  id: string;
  previous_license_id: string;
  status: string;
}

/*
 * GET /customers/:customerId/licenses. Its `licenses[].type`/`status` are
 * already PT-BR display labels ("Licença Prévia (LP)", "Vencida"), unlike
 * LicenseWire's `type` (raw "LP"/"LI"/"LO" enum) from the create endpoint —
 * two different wire shapes on purpose, mirrored by two domain types.
 */
export interface LicenseSummaryWire {
  total: number;
  regular: number;
  attention: number;
  expired: number;
}

export interface LicensePanelItemWire {
  id: string;
  type: string;
  process_number: string;
  issuing_agency: string | null;
  issue_date: string;
  expiration_date: string;
  status: string;
  /** PDF document URL — null when none has been stored yet. */
  document_url: string | null;
}

export interface LicenseDocumentUrlWire {
  /** Short-lived pre-signed URL to the license PDF. */
  document_url: string;
  /** Seconds until document_url expires; null when it does not expire. */
  expires_in: number | null;
}

export interface LicensePanelResponseWire {
  summary: LicenseSummaryWire;
  licenses: LicensePanelItemWire[];
}

export interface LicenseDashboardHeaderWire {
  active_licenses: number;
  pending_items: number;
}

export interface LicenseDashboardCriticalItemWire {
  id: string;
  type: string;
  process_number: string;
  expiration_date: string;
  status: string;
}

export interface LicenseDashboardCountsWire {
  regular: number;
  attention: number;
  expired: number;
}

export interface LicenseDashboardWire {
  header: LicenseDashboardHeaderWire;
  counts: LicenseDashboardCountsWire;
  critical: LicenseDashboardCriticalItemWire[];
export interface DocumentWire {
  id: string;
  title: string;
  document_date: string;
  file_name: string;
  size_bytes: number;
  uploaded_by: {
    id: string;
    name: string;
  };
  created_at: string;
  folder_id: string | null;
}

export interface DocumentFolderWire {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export interface FileAccessUrlWire {
  document_url: string;
  expires_in: number | null;
}

export interface LicenseConditionWire {
  id: string;
  license_id: string;
  name: string;
  description: string | null;
  environmental_descriptor: string;
  responsible_agency: string | null;
  due_date: string;
  status: 'Regular' | 'Atenção' | 'Risco';
  has_delivery: boolean;
  is_violated: boolean;
  risk_level: 'REGULAR' | 'ATTENTION' | 'RISK';
}

export interface LicenseConditionsResponseWire {
  total: number;
  data: LicenseConditionWire[];
}

export interface LicenseConditionsComplianceWire {
  total_active: number;
  in_compliance: number;
  compliance_percentage: number;
}

export interface LicenseConditionCreatedWire {
  id: string;
  license_id: string;
  name: string;
  description: string | null;
  environmental_descriptor: string;
  responsible_agency: string | null;
  due_date: string;
  status: 'Regular' | 'Atenção' | 'Risco';
  has_delivery: boolean;
  is_violated: boolean;
  created_at: string;
}

export interface LicenseConditionBatchItemWire {
  environmental_descriptor: string;
  description: string;
  condition_type: string;
  periodicity?: string;
  deadline: string;
  responsible_name: string;
  has_delivery: boolean;
}

export interface CreateLicenseConditionsRequestWire {
  conditions: LicenseConditionBatchItemWire[];
}

/*
 * GET /customers/:customerId/esg-indicators/:month. Not in the issue's
 * contract (which only lists the PUT) — the shape mirrors the PUT body, with
 * null/absent for an indicator that was never informed.
 */
export interface EsgIndicatorsWire {
  water?: number | string | null;
  waste?: number | string | null;
  employees?: number | string | null;
  energy?: number | string | null;
}
