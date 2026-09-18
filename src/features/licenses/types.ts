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
