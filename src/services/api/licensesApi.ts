import type { License, LicenseType } from '../../features/licenses/types';
import { request } from './http';
import type { LicenseWire } from './types';

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
