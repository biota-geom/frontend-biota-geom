export type LicenseType = 'LP' | 'LI' | 'LO';

export const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  LP: 'LP - Licença Prévia',
  LI: 'LI - Licença de Instalação',
  LO: 'LO - Licença de Operação',
};

export interface IssuingAgency {
  id: string;
  name: string;
  acronym: string | null;
}

export interface License {
  id: string;
  customerId: string;
  type: LicenseType;
  processNumber: string;
  issuingAgencyId: string;
  issuingAgencyName: string | null;
  issueDate: string;
  expirationDate: string;
  status: string;
  documentUrl: string;
  createdAt: string;
}

export interface LicenseConditionDetail {
  id: string;
  itemNumber: string | null;
  description: string | null;
  conditionType: string | null;
  periodicity: string;
  deadline: string | null;
  status: string;
  completionDate: string | null;
  responsibleName: string | null;
  isViolated: boolean;
}

export interface LicenseDetails {
  id: string;
  processNumber: string;
  issueDate: string;
  expirationDate: string;
  status: string;
  conditions: LicenseConditionDetail[];
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
}

export interface LicensesPanel {
  summary: LicenseSummary;
  licenses: LicensePanelItem[];
}
