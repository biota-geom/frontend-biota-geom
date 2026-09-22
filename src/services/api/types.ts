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
