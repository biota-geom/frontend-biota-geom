import type {
  License,
  LicenseDetails,
  LicenseDocumentUrl,
  LicensePanelItem,
  LicensesPanel,
  LicenseRenewed,
  LicenseType,
} from '../../features/licenses/types';
import { request } from './http';
import type {
  LicenseDocumentUrlWire,
  LicensePanelItemWire,
  LicenseDetailsWire,
  LicensePanelResponseWire,
  LicenseRenewedWire,
  LicenseWire,
} from './types';

export interface CreateLicenseInput {
  type: LicenseType;
  processNumber: string;
  issuingAgencyId: string;
  /** `YYYY-MM-DD`, straight from a `<input type="date">`. */
  issueDate: string;
  /** `YYYY-MM-DD`, straight from a `<input type="date">`. */
  expirationDate: string;
  documentFile: File;
}

export interface RenewLicenseInput {
  processNumber: string;
  issueDate: string;
  expirationDate: string;
  documentFile: File;
}

function toLicense(wire: LicenseWire): License {
  return {
    id: wire.id,
    customerId: wire.customer_id,
    type: wire.type as LicenseType,
    processNumber: wire.process_number,
    issuingAgencyId: wire.issuing_agency_id,
    issuingAgencyName: wire.issuing_agency_name,
    issueDate: wire.issue_date,
    expirationDate: wire.expiration_date,
    status: wire.status,
    documentUrl: wire.document_url,
    createdAt: wire.created_at,
  };
}

function toLicenseDetails(wire: LicenseDetailsWire): LicenseDetails {
  return {
    id: wire.id,
    processNumber: wire.process_number,
    type: wire.type,
    issuingAgency: wire.issuing_agency,
    issueDate: wire.issue_date,
    expirationDate: wire.expiration_date,
    status: wire.status,
    conditions: wire.conditions.map((condition) => ({
      id: condition.id,
      itemNumber: condition.item_number,
      isEnvironmentalDescriptor: condition.is_environmental_descriptor,
      environmentalDescriptor: condition.environmental_descriptor,
      name: condition.name,
      description: condition.description,
      conditionType: condition.condition_type,
      periodicity: condition.periodicity,
      deadline: condition.deadline,
      status: condition.status,
      completionDate: condition.completion_date,
      responsibleName: condition.responsible_name,
      hasDelivery: condition.has_delivery,
      isViolated: condition.is_violated,
    })),
  };
}

function toLicenseRenewed(wire: LicenseRenewedWire): LicenseRenewed {
  return {
    id: wire.id,
    previousLicenseId: wire.previous_license_id,
    status: wire.status,
  };
}

export async function getLicenseDetails(
  customerId: string,
  licenseId: string
): Promise<LicenseDetails> {
  const wire = await request<LicenseDetailsWire>(
    `/api/customers/${customerId}/licenses/${licenseId}`
  );

  return toLicenseDetails(wire);
}

export async function createLicense(
  customerId: string,
  input: CreateLicenseInput
): Promise<License> {
  const formData = new FormData();
  formData.append('type', input.type);
  formData.append('process_number', input.processNumber);
  formData.append('issuing_agency_id', input.issuingAgencyId);
  formData.append('issue_date', input.issueDate);
  formData.append('expiration_date', input.expirationDate);
  formData.append('document_file', input.documentFile);

  const wire = await request<LicenseWire>(
    `/api/customers/${customerId}/licenses`,
    {
      method: 'POST',
      body: formData,
    }
  );

  return toLicense(wire);
}

export async function renewLicense(
  licenseId: string,
  input: RenewLicenseInput
): Promise<LicenseRenewed> {
  const formData = new FormData();
  formData.append('process_number', input.processNumber);
  formData.append('issue_date', input.issueDate);
  formData.append('expiration_date', input.expirationDate);
  formData.append('document_file', input.documentFile);

  const wire = await request<LicenseRenewedWire>(
    `/api/licenses/${licenseId}/renew`,
    {
      method: 'POST',
      body: formData,
    }
  );

  return toLicenseRenewed(wire);
}

/**
 * Asks the backend for a temporary URL to view the license PDF. The bucket is
 * private, so the stored document_url cannot be opened directly.
 */
export async function getLicenseDocumentUrl(
  licenseId: string
): Promise<LicenseDocumentUrl> {
  const wire = await request<LicenseDocumentUrlWire>(
    `/api/licenses/${licenseId}/document/url`
  );

  return { url: wire.document_url, expiresIn: wire.expires_in };
}

function toLicensePanelItem(wire: LicensePanelItemWire): LicensePanelItem {
  return {
    id: wire.id,
    type: wire.type,
    processNumber: wire.process_number,
    issuingAgency: wire.issuing_agency,
    issueDate: wire.issue_date,
    expirationDate: wire.expiration_date,
    status: wire.status,
    documentUrl: wire.document_url,
  };
}

export async function listLicenses(customerId: string): Promise<LicensesPanel> {
  const wire = await request<LicensePanelResponseWire>(
    `/api/customers/${customerId}/licenses`
  );

  return {
    summary: wire.summary,
    licenses: wire.licenses.map(toLicensePanelItem),
  };
}
